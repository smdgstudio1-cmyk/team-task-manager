import { useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/Card'
import { Input, FieldWrap } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'

export function SettingsPage() {
  const adminUser = useAuthStore((s) => s.adminUser)
  const signOut = useAuthStore((s) => s.signOut)
  const [newPassword, setNewPassword] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  if (!adminUser) return null

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setMessage(null)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSaving(false)
    if (error) {
      setError(error.message)
      return
    }
    setNewPassword('')
    setMessage('Password updated.')
    setTimeout(() => setMessage(null), 3000)
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your account and private access.</p>
      </div>

      <Card>
        <div className="flex items-center gap-3">
          <Avatar name={adminUser.email} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink-900">{adminUser.email}</p>
            <p className="flex items-center gap-1 text-xs text-ink-500">
              <ShieldCheck size={13} />
              Studio manager — only account with access
            </p>
          </div>
        </div>
        <dl className="mt-4 space-y-2 border-t border-ink-100 pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-500">Member since</dt>
            <dd className="text-ink-800">{formatDate(adminUser.created_at)}</dd>
          </div>
        </dl>
      </Card>

      <Card>
        <h2 className="mb-1 flex items-center gap-1.5 text-sm font-semibold text-ink-800">
          <Lock size={14} />
          Change password
        </h2>
        <p className="mb-3 text-sm text-ink-500">Update the password used to sign in to this private workspace.</p>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <FieldWrap label="New password">
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              minLength={6}
              required
              placeholder="••••••••"
            />
          </FieldWrap>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Updating...' : 'Update password'}
            </Button>
            {message && <span className="text-sm text-emerald-600">{message}</span>}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-1 text-sm font-semibold text-ink-800">Sign out</h2>
        <p className="mb-3 text-sm text-ink-500">You'll need to sign in again to access your workspace.</p>
        <Button variant="danger" size="sm" onClick={signOut}>
          Sign out
        </Button>
      </Card>
    </div>
  )
}
