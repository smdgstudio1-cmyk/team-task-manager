import { useDataStore } from '@/store/dataStore'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'

export function CompletedPage() {
  const tasks = useDataStore((s) => s.tasks)
  const completedTasks = tasks.filter((t) => t.status === 'Completed')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Completed</h1>
        <p className="mt-1 text-sm text-ink-500">A record of finished work.</p>
      </div>
      <TaskExplorer tasks={completedTasks} />
    </div>
  )
}
