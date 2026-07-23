import { useState } from 'react'
import { Pencil, Trash2, MessageSquarePlus } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'
import { Textarea } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/store/toastStore'
import { formatRelative } from '@/lib/utils'
import type { TaskNote } from '@/lib/types'

export function NotesSection({ taskId }: { taskId: string }) {
  const notes = useDataStore((s) => s.notesByTask[taskId]) || []
  const createNote = useDataStore((s) => s.createNote)
  const updateNote = useDataStore((s) => s.updateNote)
  const deleteNote = useDataStore((s) => s.deleteNote)
  const adminUser = useAuthStore((s) => s.adminUser)

  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [pendingDelete, setPendingDelete] = useState<TaskNote | null>(null)

  async function handleAdd() {
    if (!draft.trim()) return
    setSubmitting(true)
    await createNote(taskId, draft.trim())
    setDraft('')
    setSubmitting(false)
    toast.success('Note added')
  }

  function startEdit(note: TaskNote) {
    setEditingId(note.id)
    setEditBody(note.body)
  }

  async function saveEdit(note: TaskNote) {
    if (!editBody.trim()) return
    await updateNote(note.id, taskId, editBody.trim())
    setEditingId(null)
    toast.success('Note updated')
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteNote(pendingDelete.id, taskId)
    toast.success('Note deleted')
    setPendingDelete(null)
  }

  return (
    <div>
      <p className="mb-2 text-sm font-semibold text-brand-400">Notes</p>

      <div className="mb-3 space-y-2">
        <Textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={2}
          placeholder="Add a note — feedback, progress update, reminder..."
        />
        <div className="flex justify-end">
          <Button size="sm" onClick={handleAdd} disabled={submitting || !draft.trim()}>
            <MessageSquarePlus size={14} />
            Add note
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {notes.map((note) => (
          <div key={note.id} className="rounded-xl border border-white/8 bg-white/5 p-3">
            {editingId === note.id ? (
              <div className="space-y-2">
                <Textarea value={editBody} onChange={(e) => setEditBody(e.target.value)} rows={2} autoFocus />
                <div className="flex justify-end gap-2">
                  <Button size="sm" variant="secondary" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={() => saveEdit(note)}>
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="whitespace-pre-wrap text-sm text-ink-200">{note.body}</p>
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-ink-500">
                    {adminUser?.email || 'You'} · {formatRelative(note.created_at)}
                    {note.updated_at !== note.created_at && ' (edited)'}
                  </p>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(note)} className="rounded p-1 text-ink-400 hover:bg-white/8 hover:text-ink-100">
                      <Pencil size={13} />
                    </button>
                    <button
                      onClick={() => setPendingDelete(note)}
                      className="rounded p-1 text-ink-400 hover:bg-red-500/15 hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
        {notes.length === 0 && <p className="px-1 text-sm text-ink-500">No notes yet.</p>}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Delete this note?"
        description="This can't be undone."
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
