import type { Task } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { formatRelative } from '@/lib/utils'
import { useDataStore } from '@/store/dataStore'
import { useState } from 'react'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'

export function TaskMiniList({
  title,
  tasks,
  dateField = 'deadline',
  emptyLabel = 'Nothing here',
  showAssignee = true,
}: {
  title: string
  tasks: Task[]
  dateField?: 'deadline' | 'completed_at'
  emptyLabel?: string
  showAssignee?: boolean
}) {
  const profiles = useDataStore((s) => s.profiles)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  return (
    <Card>
      <h3 className="mb-3 text-sm font-semibold text-ink-800">{title}</h3>
      <div className="space-y-1">
        {tasks.length === 0 && <p className="text-sm text-ink-400">{emptyLabel}</p>}
        {tasks.map((t) => {
          const assignee = profiles.find((p) => p.id === t.assigned_user_id)
          const dateValue = dateField === 'completed_at' ? t.completed_at : t.deadline
          return (
            <button
              key={t.id}
              onClick={() => setOpenTaskId(t.id)}
              className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-ink-50"
            >
              {showAssignee && assignee && <Avatar name={assignee.name} size="sm" />}
              <span className="min-w-0 flex-1 truncate text-sm text-ink-800">{t.title}</span>
              <StatusBadge status={t.status} className="hidden sm:inline-flex" />
              <span className="shrink-0 text-xs text-ink-400">{formatRelative(dateValue)}</span>
            </button>
          )
        })}
      </div>
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </Card>
  )
}
