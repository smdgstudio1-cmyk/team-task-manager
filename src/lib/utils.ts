import type { Task, TaskPriority, TaskStatus } from './types'

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ')
}

export function isOverdue(task: Pick<Task, 'deadline' | 'status'>): boolean {
  if (!task.deadline || task.status === 'Completed') return false
  return new Date(task.deadline).getTime() < Date.now()
}

export function isDueToday(task: Pick<Task, 'deadline' | 'status'>): boolean {
  if (!task.deadline || task.status === 'Completed') return false
  const d = new Date(task.deadline)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

export function isDueThisWeek(task: Pick<Task, 'deadline' | 'status'>): boolean {
  if (!task.deadline || task.status === 'Completed') return false
  const d = new Date(task.deadline).getTime()
  const now = Date.now()
  const weekOut = now + 7 * 24 * 60 * 60 * 1000
  return d >= now && d <= weekOut
}

export function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null
  const diff = new Date(deadline).getTime() - Date.now()
  return Math.ceil(diff / (24 * 60 * 60 * 1000))
}

export function formatDate(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function formatDateShort(value: string | null): string {
  if (!value) return '—'
  const d = new Date(value)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export function formatRelative(value: string | null): string {
  if (!value) return '—'
  const diffMs = new Date(value).getTime() - Date.now()
  const diffDays = Math.round(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  if (diffDays === -1) return 'Yesterday'
  if (diffDays > 1 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < -1 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`
  return formatDateShort(value)
}

export function calcProgress(completed: number, total: number): number {
  if (total === 0) return 0
  return Math.round((completed / total) * 100)
}

export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  'Not Started': { bg: 'bg-ink-100', text: 'text-ink-700', dot: 'bg-ink-400' },
  'In Progress': { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
  'Waiting / Blocked': { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  'In Review': { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500' },
  Completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500' },
}

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; dot: string }> = {
  Low: { bg: 'bg-ink-100', text: 'text-ink-600', dot: 'bg-ink-400' },
  Medium: { bg: 'bg-sky-50', text: 'text-sky-700', dot: 'bg-sky-500' },
  High: { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  Urgent: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
