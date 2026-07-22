import { ListTodo, CheckCircle2, AlertTriangle, CalendarClock, Sun, TrendingUp } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { StatCard } from './StatCard'
import { TaskMiniList } from './TaskMiniList'
import { StatusChart } from './StatusChart'
import { ProgressByFolder } from './ProgressByFolder'
import { calcProgress, isDueThisWeek, isDueToday, isOverdue } from '@/lib/utils'

export function PersonalDashboard({ profileId }: { profileId: string }) {
  const allTasks = useDataStore((s) => s.tasks)
  const folders = useDataStore((s) => s.folders)
  const profile = useDataStore((s) => s.profiles.find((p) => p.id === profileId))

  const tasks = allTasks.filter((t) => t.assigned_user_id === profileId)
  const completed = tasks.filter((t) => t.status === 'Completed')
  const active = tasks.filter((t) => t.status !== 'Completed')
  const overdue = tasks.filter((t) => isOverdue(t))
  const dueToday = active.filter((t) => isDueToday(t))
  const dueThisWeek = active.filter((t) => isDueThisWeek(t))

  const recentlyCompleted = [...completed]
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
    .slice(0, 6)

  const upcoming = [...active]
    .filter((t) => t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 6)

  const myFolders = folders.filter((f) => f.owner_id === profileId && f.parent_folder_id === null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Welcome back{profile ? `, ${profile.name.split(' ')[0]}` : ''}</h1>
        <p className="mt-1 text-sm text-ink-500">Here's what's on your plate today.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={ListTodo} label="Active tasks" value={active.length} tint="brand" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue.length} tint="red" />
        <StatCard icon={Sun} label="Due today" value={dueToday.length} tint="amber" />
        <StatCard icon={CalendarClock} label="Due this week" value={dueThisWeek.length} tint="sky" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length} tint="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatCard icon={TrendingUp} label="Your completion rate" value={`${calcProgress(completed.length, tasks.length)}%`} tint="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatusChart tasks={tasks} />
        <ProgressByFolder rootFolders={myFolders} allFolders={folders} tasks={allTasks} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TaskMiniList title="Upcoming deadlines" tasks={upcoming} emptyLabel="Nothing due soon." showAssignee={false} />
        <TaskMiniList
          title="Recently completed"
          tasks={recentlyCompleted}
          dateField="completed_at"
          emptyLabel="No completed tasks yet."
          showAssignee={false}
        />
      </div>
    </div>
  )
}
