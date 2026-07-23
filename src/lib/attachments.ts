import { supabase } from './supabaseClient'

const BUCKET = 'task-attachments'

export async function getAttachmentSignedUrl(path: string): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 5)
  if (error) {
    console.error('Failed to create signed URL', error)
    return null
  }
  return data.signedUrl
}

export function attachmentStoragePath(taskId: string, fileName: string): string {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${taskId}/${crypto.randomUUID()}-${safeName}`
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
