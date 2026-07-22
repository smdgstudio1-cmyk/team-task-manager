import { create } from 'zustand'
import { supabase } from '@/lib/supabaseClient'
import type { Profile } from '@/lib/types'

interface AuthState {
  profile: Profile | null
  loading: boolean
  initialized: boolean
  error: string | null
  initialize: () => Promise<void>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string, name: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

async function fetchProfileForAuthUser(authUserId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('auth_user_id', authUserId)
    .maybeSingle()
  if (error) {
    console.error('Failed to fetch profile', error)
    return null
  }
  return data as Profile | null
}

export const useAuthStore = create<AuthState>((set, get) => ({
  profile: null,
  loading: true,
  initialized: false,
  error: null,

  initialize: async () => {
    if (get().initialized) return
    set({ initialized: true })

    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const profile = await fetchProfileForAuthUser(data.session.user.id)
      set({ profile, loading: false })
    } else {
      set({ loading: false })
    }

    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        const profile = await fetchProfileForAuthUser(session.user.id)
        set({ profile, loading: false })
      } else {
        set({ profile: null, loading: false })
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

  signUp: async (email, password, name) => {
    set({ error: null })
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) {
      set({ error: error.message })
      return { error: error.message }
    }
    return { error: null }
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ profile: null })
  },

  refreshProfile: async () => {
    const { data } = await supabase.auth.getSession()
    if (data.session?.user) {
      const profile = await fetchProfileForAuthUser(data.session.user.id)
      set({ profile })
    }
  },
}))
