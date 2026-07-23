import type { TaskPriority, TaskStatus } from '@/lib/types'
import { PRIORITY_COLORS, STATUS_COLORS, cx } from '@/lib/utils'

export function StatusBadge({ status, className }: { status: TaskStatus; className?: string }) {
  const c = STATUS_COLORS[status]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        c.bg,
        c.text,
        className
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />
      {status}
    </span>
  )
}

export function PriorityBadge({ priority, className }: { priority: TaskPriority; className?: string }) {
  const c = PRIORITY_COLORS[priority]
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap',
        c.bg,
        c.text,
        className
      )}
    >
      <span className={cx('h-1.5 w-1.5 rounded-full', c.dot)} />
      {priority}
    </span>
  )
}

export function OverdueBadge({ className }: { className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-semibold text-red-400 whitespace-nowrap',
        className
      )}
    >
      Overdue
    </span>
  )
}
