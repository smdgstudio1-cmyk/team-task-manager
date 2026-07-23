import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import type { AdminUser } from '@/lib/types'

interface AuthState {
  adminUser: AdminUser | null
  loading: boolean
  initialized: boolean
  error: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

async function fetchAdminUser(): Promise<AdminUser | null> {
  const { data, error } = await supabase.from('admin_user').select('*').maybeSingle()
  if (error) {
    console.error('Failed to fetch admin user', error)
    return null
  }
  return data as AdminUser | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  adminUser: null,
  loading: true,
  initialized: false,
  error: null,

  initialize: async () => {
    if (get().initialized) return
    set({ initialized: true })

    const { data } = await supabase.auth.getSession()
    if (data.session) {
      const adminUser = await fetchAdminUser()
      set({ adminUser, loading: false })
    } else {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const adminUser = await fetchAdminUser()
        set({ adminUser, loading: false })
      } else {
        set({ adminUser: null, loading: false })
      }
    })
  },

  signIn: async (email, password) => {
    set({ error: null })
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) {
      set({ error: authError.message })
      return { error: authError.message }
    }

    // Don't rely solely on the onAuthStateChange listener below to unblock
    // the redirect — it fires independently of this call and can race with
    // it (e.g. a slow admin_user lookup), leaving the sign-in button idle
    // with no feedback and no navigation. Resolve admin status here instead,
    // so the caller always gets a definite outcome: redirect or a real error.
    const adminUser = await fetchAdminUser()
    if (!adminUser) {
      const message = 'Signed in, but this account is not registered as the studio admin. Contact whoever set up this workspace.'
      set({ error: message })
      return { error: message }
    }
    set({ adminUser, error: null })
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ adminUser: null })
  },
}))
