import { useRef, useState } from 'react'
import { Paperclip, Download, Trash2, Loader2, FileText, Image as ImageIcon, File as FileIcon } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import type { TaskAttachment } from '@/lib/types'
import { formatFileSize, getAttachmentSignedUrl } from '@/lib/attachments'
import { toast } from '@/store/toastStore'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'

function iconFor(mimeType: string | null) {
  if (!mimeType) return FileIcon
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType === 'application/pdf') return FileText
  return FileIcon
}

export function AttachmentsSection({ taskId }: { taskId: string }) {
  const attachments = useDataStore((s) => s.attachmentsByTask[taskId]) || []
  const uploadAttachment = useDataStore((s) => s.uploadAttachment)
  const deleteAttachment = useDataStore((s) => s.deleteAttachment)
  const [uploading, setUploading] = useState<string[]>([])
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [pendingDelete, setPendingDelete] = useState<TaskAttachment | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleFiles(files: FileList | null) {
    if (!files) return
    for (const file of Array.from(files)) {
      setUploading((u) => [...u, file.name])
      const { error } = await uploadAttachment(taskId, file)
      setUploading((u) => u.filter((n) => n !== file.name))
      if (error) toast.error(error)
      else toast.success(`${file.name} attached`)
    }
    if (inputRef.current) inputRef.current.value = ''
  }

  async function handleOpen(attachment: TaskAttachment) {
    setOpeningId(attachment.id)
    const url = await getAttachmentSignedUrl(attachment.file_path)
    setOpeningId(null)
    if (!url) {
      toast.error('Could not open this file')
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  async function confirmDelete() {
    if (!pendingDelete) return
    await deleteAttachment(pendingDelete)
    toast.success('Attachment removed')
    setPendingDelete(null)
  }

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-semibold text-brand-400">Attachments</p>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-brand-400 hover:bg-brand-500/10"
        >
          <Paperclip size={13} />
          Add file
        </button>
        <input ref={inputRef} type="file" multiple hidden onChange={(e) => handleFiles(e.target.files)} />
      </div>

      <div className="space-y-2">
        {attachments.map((a) => {
          const Icon = iconFor(a.mime_type)
          return (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/5 px-3 py-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/8 text-ink-300">
                <Icon size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-100">{a.file_name}</p>
                <p className="text-xs text-ink-500">{formatFileSize(a.file_size)}</p>
              </div>
              <button
                onClick={() => handleOpen(a)}
                disabled={openingId === a.id}
                className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-white/8 hover:text-brand-400"
                title="Open / download"
              >
                {openingId === a.id ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
              </button>
              <button
                onClick={() => setPendingDelete(a)}
                className="shrink-0 rounded-lg p-1.5 text-ink-400 hover:bg-red-500/10 hover:text-red-400"
                title="Remove"
              >
                <Trash2 size={15} />
              </button>
            </div>
          )
        })}

        {uploading.map((name) => (
          <div key={name} className="flex items-center gap-3 rounded-xl border border-dashed border-white/15 px-3 py-2.5">
            <Loader2 size={16} className="shrink-0 animate-spin text-brand-400" />
            <p className="truncate text-sm text-ink-400">Uploading {name}...</p>
          </div>
        ))}

        {attachments.length === 0 && uploading.length === 0 && (
          <button
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-3 py-4 text-sm text-ink-400 hover:border-brand-400 hover:text-brand-400"
          >
            <Paperclip size={15} />
            Drop files here or click to attach
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
        title="Remove attachment?"
        description={pendingDelete ? `"${pendingDelete.file_name}" will be permanently deleted.` : ''}
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  )
}
