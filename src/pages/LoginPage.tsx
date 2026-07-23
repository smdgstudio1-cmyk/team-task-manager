import { useState } from 'react'
import { Sparkles, Lock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, FieldWrap } from '@/components/ui/Field'
import { useAuthStore } from '@/store/authStore'
import { isSupabaseConfigured } from '@/lib/supabaseClient'

export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const signIn = useAuthStore((s) => s.signIn)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await signIn(email, password)
    if (error) setError(error)
    setSubmitting(false)
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink-900 px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-60"
        style={{
          background:
            'radial-gradient(circle at 20% 15%, rgba(124,77,255,0.35), transparent 40%), radial-gradient(circle at 85% 80%, rgba(250,106,30,0.18), transparent 45%)',
        }}
      />

      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-soft-lg">
            <Sparkles size={22} />
          </div>
          <h1 className="text-xl font-semibold text-white">Lumen Studio</h1>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink-300">
            <Lock size={13} />
            Private workspace
          </p>
        </div>

        {!isSupabaseConfigured && (
          <div className="mb-4 rounded-xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
            Supabase isn't connected yet. Add <code className="rounded bg-amber-500/20 px-1">VITE_SUPABASE_URL</code> and{' '}
            <code className="rounded bg-amber-500/20 px-1">VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file.
          </div>
        )}

        <div className="glass rounded-2xl border border-white/10 p-7 shadow-soft-lg">
          <p className="mb-5 text-sm text-ink-400">Sign in to manage your studio's projects and tasks.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <FieldWrap label="Email">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
                placeholder="you@studio.co"
              />
            </FieldWrap>
            <FieldWrap label="Password">
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </FieldWrap>

            {error && <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Signing in...' : 'Sign in'}
            </Button>
          </form>
        </div>

        <p className="relative mt-5 text-center text-xs text-ink-400">
          This is a private tool for one studio manager. There is no public sign-up.
        </p>
      </div>
    </div>
  )
}
