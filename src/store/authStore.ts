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
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      set({ error: error.message })
      return { error: error.message }
    }
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ adminUser: null })
  },
}))
