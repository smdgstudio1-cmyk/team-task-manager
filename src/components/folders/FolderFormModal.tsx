import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, FieldWrap } from '@/components/ui/Field'
import { useDataStore } from '@/store/dataStore'
import type { Folder } from '@/lib/types'

export function FolderFormModal({
  open,
  onClose,
  folder,
  ownerId,
  parentFolderId,
}: {
  open: boolean
  onClose: () => void
  folder?: Folder | null
  ownerId?: string
  parentFolderId?: string | null
}) {
  const createFolder = useDataStore((s) => s.createFolder)
  const updateFolder = useDataStore((s) => s.updateFolder)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setName(folder?.name || '')
    setDescription(folder?.description || '')
  }, [open, folder])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    if (folder) {
      await updateFolder(folder.id, { name: name.trim(), description: description.trim() || null })
    } else if (ownerId) {
      await createFolder({
        name: name.trim(),
        description: description.trim() || null,
        owner_id: ownerId,
        parent_folder_id: parentFolderId ?? null,
      })
    }
    setSubmitting(false)
    onClose()
  }

  const title = folder ? 'Rename folder' : parentFolderId ? 'New subfolder' : 'New folder'

  return (
    <Modal open={open} onClose={onClose} title={title} width="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <FieldWrap label="Name">
          <Input value={name} onChange={(e) => setName(e.target.value)} required autoFocus placeholder="e.g. Nova Coffee" />
        </FieldWrap>
        <FieldWrap label="Description (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="What's this for?" />
        </FieldWrap>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : folder ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
