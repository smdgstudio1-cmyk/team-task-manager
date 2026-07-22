import { ListTodo, CheckCircle2, AlertTriangle, CalendarClock, Clock, PauseCircle, TrendingUp, Sun } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { StatCard } from './StatCard'
import { ProgressByMember } from './ProgressByMember'
import { ProgressByFolder } from './ProgressByFolder'
import { StatusChart } from './StatusChart'
import { TaskMiniList } from './TaskMiniList'
import { calcProgress, isDueThisWeek, isDueToday, isOverdue } from '@/lib/utils'

export function AdminDashboard() {
  const tasks = useDataStore((s) => s.tasks)
  const profiles = useDataStore((s) => s.profiles)
  const folders = useDataStore((s) => s.folders)

  const completed = tasks.filter((t) => t.status === 'Completed')
  const active = tasks.filter((t) => t.status !== 'Completed')
  const overdue = tasks.filter((t) => isOverdue(t))
  const dueToday = active.filter((t) => isDueToday(t))
  const dueThisWeek = active.filter((t) => isDueThisWeek(t))
  const inProgress = tasks.filter((t) => t.status === 'In Progress')
  const blocked = tasks.filter((t) => t.status === 'Waiting / Blocked')

  const recentlyCompleted = [...completed]
    .sort((a, b) => new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime())
    .slice(0, 6)

  const upcoming = [...active]
    .filter((t) => t.deadline)
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 6)

  const overdueAttention = [...overdue]
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 6)

  const rootFolders = folders.filter((f) => f.parent_folder_id === null)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Team overview</h1>
        <p className="mt-1 text-sm text-ink-500">A complete picture of what the studio is working on.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatCard icon={ListTodo} label="Active tasks" value={active.length} tint="brand" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length} tint="emerald" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue.length} tint="red" />
        <StatCard icon={Sun} label="Due today" value={dueToday.length} tint="amber" />
        <StatCard icon={CalendarClock} label="Due this week" value={dueThisWeek.length} tint="sky" />
        <StatCard icon={Clock} label="In progress" value={inProgress.length} tint="brand" />
        <StatCard icon={PauseCircle} label="Waiting / blocked" value={blocked.length} tint="amber" />
        <StatCard icon={TrendingUp} label="Completion rate" value={`${calcProgress(completed.length, tasks.length)}%`} tint="emerald" />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProgressByMember profiles={profiles} tasks={tasks} />
        <ProgressByFolder rootFolders={rootFolders} allFolders={folders} tasks={tasks} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatusChart tasks={tasks} />
        <TaskMiniList
          title="Overdue — needs attention"
          tasks={overdueAttention}
          emptyLabel="Nothing overdue. Great work!"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TaskMiniList title="Upcoming deadlines" tasks={upcoming} emptyLabel="No upcoming deadlines." />
        <TaskMiniList
          title="Recently completed"
          tasks={recentlyCompleted}
          dateField="completed_at"
          emptyLabel="No completed tasks yet."
        />
      </div>
    </div>
  )
}
