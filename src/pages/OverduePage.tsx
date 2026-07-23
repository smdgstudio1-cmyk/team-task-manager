import { useDataStore } from '@/store/dataStore'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'
import { isOverdue } from '@/lib/utils'

export function OverduePage() {
  const tasks = useDataStore((s) => s.tasks)
  const overdueTasks = tasks.filter((t) => isOverdue(t))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-50">Overdue</h1>
        <p className="mt-1 text-sm text-ink-400">Tasks across the studio that have passed their deadline.</p>
      </div>
      <TaskExplorer tasks={overdueTasks} />
    </div>
  )
}
