import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, FieldWrap } from '@/components/ui/Field'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export function LoginPage() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const signIn = useAuthStore((s) => s.signIn)
  const signUp = useAuthStore((s) => s.signUp)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setMessage(null)
    if (mode === 'signin') {
      const { error } = await signIn(email, password)
      if (error) setMessage(error)
    } else {
      const { error } = await signUp(email, password, name)
      if (error) setMessage(error)
      else setMessage('Account created! Check your inbox to confirm your email, then sign in.')
    }
    setSubmitting(false)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-50 px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-600 text-white">
            <Sparkles size={22} />
          </div>
          <h1 className="text-xl font-semibold text-ink-900">Lumen Studio</h1>
          <p className="mt-1 text-sm text-ink-500">Team task management for creative studios</p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            Supabase isn't connected yet. Add <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-amber-100 px-1">VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file.
          </div>
        )}

        <div className="rounded-2xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex rounded-xl bg-ink-100 p-1">
            <button
              onClick={() => setMode('signin')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'signin' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
            >
              Sign in
            </button>
            <button
              onClick={() => setMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${mode === 'signup' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <FieldWrap label="Full name">
                <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Jamie Fox" />
              </FieldWrap>
            )}
            <FieldWrap label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@studio.co"
              />
            </FieldWrap>
            <FieldWrap label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </FieldWrap>

            {message && (
              <p className="rounded-lg bg-ink-50 px-3 py-2 text-sm text-ink-600">{message}</p>
            )}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Please wait...' : mode === 'signin' ? 'Sign in' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-ink-400">
          The first person to create an account becomes the admin / project manager.
        </p>
      </div>
    </div>
  )
}
