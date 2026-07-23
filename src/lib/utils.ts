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
  // Compare calendar days (midnight to midnight), not raw millisecond deltas —
  // otherwise a deadline of "yesterday at midnight" checked in the afternoon
  // reads as "2 days ago" purely from the time-of-day offset.
  const target = new Date(value)
  const today = new Date()
  const targetDay = Date.UTC(target.getFullYear(), target.getMonth(), target.getDate())
  const todayDay = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
  const diffDays = Math.round((targetDay - todayDay) / (24 * 60 * 60 * 1000))
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

// Soft-glow chips: translucent tint background + bright saturated text — the
// standard dark-UI badge pattern. Pastel-on-white chips would look muddy here.
export const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; dot: string }> = {
  'Not Started': { bg: 'bg-ink-500/15', text: 'text-ink-300', dot: 'bg-ink-400' },
  'In Progress': { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400' },
  'Waiting / Blocked': { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400' },
  'In Review': { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  Completed: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400' },
}

export const PRIORITY_COLORS: Record<TaskPriority, { bg: string; text: string; dot: string }> = {
  Low: { bg: 'bg-ink-500/15', text: 'text-ink-300', dot: 'bg-ink-400' },
  Medium: { bg: 'bg-sky-500/15', text: 'text-sky-400', dot: 'bg-sky-400' },
  High: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400' },
  Urgent: { bg: 'bg-red-500/15', text: 'text-red-400', dot: 'bg-red-400' },
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}
