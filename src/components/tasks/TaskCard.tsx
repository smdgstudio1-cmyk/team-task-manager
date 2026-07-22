import { Check, Calendar } from 'lucide-react'
import type { Task } from '@/lib/types'
import { StatusBadge, PriorityBadge, OverdueBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cx, formatRelative, isOverdue } from '@/lib/utils'
import { useDataStore } from '@/store/dataStore'

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const profiles = useDataStore((s) => s.profiles)
  const updateTask = useDataStore((s) => s.updateTask)
  const assignee = profiles.find((p) => p.id === task.assigned_user_id)
  const overdue = isOverdue(task)
  const completed = task.status === 'Completed'

  function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    updateTask(task.id, { status: completed ? 'Not Started' : 'Completed' })
  }

  return (
    <button
      onClick={onClick}
      className={cx(
        'flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-white px-4 py-3.5 text-left transition-shadow hover:shadow-md',
        completed && 'opacity-60'
      )}
    >
      <button
        onClick={toggleComplete}
        className={cx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-ink-300 hover:border-brand-500'
        )}
        aria-label="Toggle complete"
      >
        {completed && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cx('truncate text-sm font-medium text-ink-900', completed && 'line-through')}>{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {overdue && <OverdueBadge />}
          {task.deadline && (
            <span className="flex items-center gap-1 text-xs text-ink-400">
              <Calendar size={12} />
              {formatRelative(task.deadline)}
            </span>
          )}
        </div>
      </div>

      {assignee && <Avatar name={assignee.name} size="sm" className="shrink-0" />}
    </button>
  )
}
