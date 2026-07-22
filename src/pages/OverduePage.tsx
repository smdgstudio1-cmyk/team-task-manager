import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'
import { isOverdue } from '@/lib/utils'

export function OverduePage() {
  const profile = useAuthStore((s) => s.profile)
  const tasks = useDataStore((s) => s.tasks)
  if (!profile) return null

  const isAdmin = profile.role === 'admin'
  const scoped = isAdmin ? tasks : tasks.filter((t) => t.assigned_user_id === profile.id)
  const overdueTasks = scoped.filter((t) => isOverdue(t))

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Overdue</h1>
        <p className="mt-1 text-sm text-ink-500">
          {isAdmin ? 'Tasks across the team that have passed their deadline.' : 'Your tasks that have passed their deadline.'}
        </p>
      </div>
      <TaskExplorer tasks={overdueTasks} showAssigneeFilter={isAdmin} />
    </div>
  )
}
