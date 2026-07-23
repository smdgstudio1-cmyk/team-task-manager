import { Check, Calendar } from 'lucide-react'
import type { Task } from '@/lib/types'
import { StatusBadge, PriorityBadge, OverdueBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { cx, formatRelative, isOverdue } from '@/lib/utils'
import { useDataStore } from '@/store/dataStore'

export function TaskCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const teamMembers = useDataStore((s) => s.teamMembers)
  const updateTask = useDataStore((s) => s.updateTask)
  const assignee = teamMembers.find((p) => p.id === task.assigned_user_id)
  const overdue = isOverdue(task)
  const completed = task.status === 'Completed'

  function toggleComplete(e: React.MouseEvent) {
    e.stopPropagation()
    updateTask(task.id, { status: completed ? 'Not Started' : 'Completed' })
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cx(
        'group flex w-full cursor-pointer items-center gap-3 rounded-xl border border-white/8 bg-ink-800 px-3.5 py-3 text-left transition-all hover:-translate-y-px hover:border-white/20 hover:shadow-soft',
        completed && 'opacity-60'
      )}
    >
      <button
        onClick={toggleComplete}
        className={cx(
          'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
          completed ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-ink-600 group-hover:border-brand-400'
        )}
        aria-label="Toggle complete"
      >
        {completed && <Check size={12} strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={cx('truncate text-sm font-medium text-ink-50', completed && 'line-through')}>{task.title}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {overdue && <OverdueBadge />}
          {task.deadline && (
            <span className="flex items-center gap-1 text-xs text-ink-400">
              <Calendar size={11} />
              {formatRelative(task.deadline)}
            </span>
          )}
        </div>
      </div>

      {assignee && <Avatar name={assignee.name} size="sm" className="shrink-0" />}
    </div>
  )
}
