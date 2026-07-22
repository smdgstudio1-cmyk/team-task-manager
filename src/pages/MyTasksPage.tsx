import { useSearchParams } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'

export function MyTasksPage() {
  const profile = useAuthStore((s) => s.profile)
  const tasks = useDataStore((s) => s.tasks)
  const [searchParams] = useSearchParams()

  if (!profile) return null
  const myTasks = tasks.filter((t) => t.assigned_user_id === profile.id)

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">My Tasks</h1>
        <p className="mt-1 text-sm text-ink-500">Everything assigned to you, across every folder.</p>
      </div>
      <TaskExplorer tasks={myTasks} showAssigneeFilter={false} initialOpenTaskId={searchParams.get('task')} />
    </div>
  )
}
