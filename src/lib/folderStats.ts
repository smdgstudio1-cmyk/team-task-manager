import type { Folder, Task } from './types'
import { calcProgress, isOverdue } from './utils'

export function getChildFolders(folderId: string | null, folders: Folder[]): Folder[] {
  return folders.filter((f) => f.parent_folder_id === folderId)
}

export function getDescendantFolderIds(folderId: string, folders: Folder[]): string[] {
  const direct = folders.filter((f) => f.parent_folder_id === folderId)
  let ids = [folderId]
  for (const child of direct) {
    ids = ids.concat(getDescendantFolderIds(child.id, folders))
  }
  return ids
}

export function getTasksForFolderTree(folderId: string, folders: Folder[], tasks: Task[]): Task[] {
  const ids = new Set(getDescendantFolderIds(folderId, folders))
  return tasks.filter((t) => ids.has(t.folder_id))
}

export interface FolderStats {
  total: number
  completed: number
  active: number
  overdue: number
  progress: number
}

export function getFolderStats(folderId: string, folders: Folder[], tasks: Task[]): FolderStats {
  const scoped = getTasksForFolderTree(folderId, folders, tasks)
  const completed = scoped.filter((t) => t.status === 'Completed').length
  const overdue = scoped.filter((t) => isOverdue(t)).length
  return {
    total: scoped.length,
    completed,
    active: scoped.length - completed,
    overdue,
    progress: calcProgress(completed, scoped.length),
  }
}

export function getFolderPath(folderId: string, folders: Folder[]): Folder[] {
  const path: Folder[] = []
  let current = folders.find((f) => f.id === folderId)
  while (current) {
    path.unshift(current)
    current = current.parent_folder_id ? folders.find((f) => f.id === current!.parent_folder_id) : undefined
  }
  return path
}
