import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Task } from '@/lib/types'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/ui/EmptyState'
import { ListChecks } from 'lucide-react'

export function TaskListView({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  const [showCompleted, setShowCompleted] = useState(false)
  const active = tasks.filter((t) => t.status !== 'Completed')
  const completed = tasks.filter((t) => t.status === 'Completed')

  if (tasks.length === 0) {
    return <EmptyState icon={ListChecks} title="No tasks yet" description="Create a task to get started." />
  }

  return (
    <div className="space-y-2">
      {active.map((t) => (
        <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} />
      ))}

      {active.length === 0 && (
        <p className="rounded-xl border border-dashed border-ink-200 px-4 py-6 text-center text-sm text-ink-400">
          No active tasks — nice and clear.
        </p>
      )}

      {completed.length > 0 && (
        <div className="pt-3">
          <button
            onClick={() => setShowCompleted((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-500 hover:text-ink-700"
          >
            {showCompleted ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Completed ({completed.length})
          </button>
          {showCompleted && (
            <div className="mt-2 space-y-2">
              {completed.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
