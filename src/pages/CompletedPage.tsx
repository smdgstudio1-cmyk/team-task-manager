import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'

export function CompletedPage() {
  const profile = useAuthStore((s) => s.profile)
  const tasks = useDataStore((s) => s.tasks)
  if (!profile) return null

  const isAdmin = profile.role === 'admin'
  const scoped = isAdmin ? tasks : tasks.filter((t) => t.assigned_user_id === profile.id)
  const completedTasks = scoped.filter((t) => t.status === 'Completed')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Completed</h1>
        <p className="mt-1 text-sm text-ink-500">A record of finished work.</p>
      </div>
      <TaskExplorer tasks={completedTasks} showAssigneeFilter={isAdmin} />
    </div>
  )
}
