import { useState } from 'react'
import { useAuthStore } from '@/store/authStore'
import { supabase } from '@/lib/supabaseClient'
import { Card } from '@/components/ui/Card'
import { Input, FieldWrap } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import { formatDate } from '@/lib/utils'

export function SettingsPage() {
  const profile = useAuthStore((s) => s.profile)
  const refreshProfile = useAuthStore((s) => s.refreshProfile)
  const signOut = useAuthStore((s) => s.signOut)
  const [name, setName] = useState(profile?.name || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  if (!profile) return null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    await supabase.from('profiles').update({ name: name.trim() }).eq('id', profile!.id)
    await refreshProfile()
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-xl space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">Manage your profile and account.</p>
      </div>

      <Card>
        <div className="mb-4 flex items-center gap-3">
          <Avatar name={profile.name} size="lg" />
          <div>
            <p className="font-semibold text-ink-900">{profile.name}</p>
            <p className="text-xs text-ink-500">{profile.role === 'admin' ? 'Project Manager' : 'Team Member'}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          <FieldWrap label="Display name">
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </FieldWrap>
          <FieldWrap label="Email">
            <Input value={profile.email} disabled className="opacity-60" />
          </FieldWrap>
          <div className="flex items-center gap-3">
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? 'Saving...' : 'Save changes'}
            </Button>
            {saved && <span className="text-sm text-emerald-600">Saved</span>}
          </div>
        </form>
      </Card>

      <Card>
        <h2 className="mb-3 text-sm font-semibold text-ink-800">Account</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-ink-500">Member since</dt>
            <dd className="text-ink-800">{formatDate(profile.created_at)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-500">Role</dt>
            <dd className="text-ink-800">{profile.role === 'admin' ? 'Admin / Project Manager' : 'Team Member'}</dd>
          </div>
        </dl>
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
