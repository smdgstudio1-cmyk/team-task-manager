import { useSearchParams } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'

export function MyTasksPage() {
  const tasks = useDataStore((s) => s.tasks)
  const [searchParams] = useSearchParams()

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">My Studio Tasks</h1>
        <p className="mt-1 text-sm text-ink-500">Every task across the studio, in one place.</p>
      </div>
      <TaskExplorer tasks={tasks} initialOpenTaskId={searchParams.get('task')} />
    </div>
  )
}
