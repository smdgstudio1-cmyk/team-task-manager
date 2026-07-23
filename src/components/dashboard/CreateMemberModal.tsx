import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, FieldWrap } from '@/components/ui/Field'
import { useDataStore } from '@/store/dataStore'
import type { TeamMember } from '@/lib/types'

export function CreateMemberModal({
  open,
  onClose,
  member,
}: {
  open: boolean
  onClose: () => void
  member?: TeamMember | null
}) {
  const createTeamMember = useDataStore((s) => s.createTeamMember)
  const updateTeamMember = useDataStore((s) => s.updateTeamMember)
  const [name, setName] = useState('')
  const [title, setTitle] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(member?.name || '')
    setTitle(member?.title || '')
    setError(null)
  }, [open, member])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError(null)
    if (member) {
      await updateTeamMember(member.id, { name: name.trim(), title: title.trim() || null })
    } else {
      const { error } = await createTeamMember({ name: name.trim(), title: title.trim() || null })
      if (error) {
        setError(error)
        setSubmitting(false)
        return
      }
    }
    setSubmitting(false)
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={member ? 'Edit team member' : 'Add team member'} width="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrap label="Full name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="e.g. Taylor Kim" />
        </FieldWrap>
        <FieldWrap label="Role or title (optional)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Designer, Copywriter" />
        </FieldWrap>
        <p className="text-xs text-ink-400">This is an internal record only — no login, email, or password, ever.</p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : member ? 'Save changes' : 'Add member'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
