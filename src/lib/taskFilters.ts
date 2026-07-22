import type { Task, TaskPriority, TaskStatus } from './types'
import { isOverdue } from './utils'

export interface TaskFilterState {
  assignedUserId: string | 'all'
  status: TaskStatus | 'all'
  priority: TaskPriority | 'all'
  folderId: string | 'all'
  completion: 'all' | 'completed' | 'incomplete'
  overdue: 'all' | 'overdue' | 'on_time'
  search: string
}

export const DEFAULT_FILTERS: TaskFilterState = {
  assignedUserId: 'all',
  status: 'all',
  priority: 'all',
  folderId: 'all',
  completion: 'all',
  overdue: 'all',
  search: '',
}

export function filterTasks(tasks: Task[], filters: TaskFilterState): Task[] {
  return tasks.filter((t) => {
    if (filters.assignedUserId !== 'all' && t.assigned_user_id !== filters.assignedUserId) return false
    if (filters.status !== 'all' && t.status !== filters.status) return false
    if (filters.priority !== 'all' && t.priority !== filters.priority) return false
    if (filters.folderId !== 'all' && t.folder_id !== filters.folderId) return false
    if (filters.completion === 'completed' && t.status !== 'Completed') return false
    if (filters.completion === 'incomplete' && t.status === 'Completed') return false
    if (filters.overdue === 'overdue' && !isOverdue(t)) return false
    if (filters.overdue === 'on_time' && isOverdue(t)) return false
    if (filters.search.trim() && !t.title.toLowerCase().includes(filters.search.trim().toLowerCase())) return false
    return true
  })
}

export function hasActiveFilters(filters: TaskFilterState): boolean {
  return (
    filters.assignedUserId !== 'all' ||
    filters.status !== 'all' ||
    filters.priority !== 'all' ||
    filters.folderId !== 'all' ||
    filters.completion !== 'all' ||
    filters.overdue !== 'all' ||
    filters.search.trim() !== ''
  )
}
