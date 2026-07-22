import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, FieldWrap } from '@/components/ui/Field'
import { useDataStore } from '@/store/dataStore'

export function CreateMemberModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const createProfile = useDataStore((s) => s.createProfile)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    const { error } = await createProfile({ name: name.trim(), email: email.trim(), role })
    setSubmitting(false)
    if (error) {
      setError(error)
      return
    }
    setName('')
    setEmail('')
    setRole('member')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add team member" width="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrap label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required placeholder="e.g. Taylor Kim" />
        </FieldWrap>
        <FieldWrap label="Email">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="taylor@studio.co" />
        </FieldWrap>
        <FieldWrap label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'member')}>
            <option value="member">Team member</option>
            <option value="admin">Admin / Project manager</option>
          </Select>
        </FieldWrap>
        <p className="text-xs text-ink-400">
          They'll appear in the team roster right away. Once they sign up with this same email, their account links
          automatically and they can log in.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Adding...' : 'Add member'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
