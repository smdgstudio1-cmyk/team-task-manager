import { ListTodo, CalendarClock, Clock, PauseCircle, Sun, CheckCircle2, TrendingUp } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { StatCard } from './StatCard'
import { CompletionRing } from './CompletionRing'
import { ProgressByMember } from './ProgressByMember'
import { ProgressByFolder } from './ProgressByFolder'
import { TaskMiniList } from './TaskMiniList'
import { StatusChart } from './StatusChart'
import { CompletionTrendChart } from './CompletionTrendChart'
import { UpcomingWorkloadChart } from './UpcomingWorkloadChart'
import { OverdueByProjectChart } from './OverdueByProjectChart'
import { calcProgress, isDueThisWeek, isDueToday, isOverdue } from '@/lib/utils'

export function StudioDashboard() {
  const allTasks = useDataStore((s) => s.tasks)
  const teamMembers = useDataStore((s) => s.teamMembers)
  const folders = useDataStore((s) => s.folders)
  const tasks = allTasks.filter((t) => !t.archived)

  const completed = tasks.filter((t) => t.status === 'Completed')
  const active = tasks.filter((t) => t.status !== 'Completed')
  const overdue = tasks.filter((t) => isOverdue(t))
  const dueToday = active.filter((t) => isDueToday(t))
  const dueThisWeek = active.filter((t) => isDueThisWeek(t))
  const inProgress = tasks.filter((t) => t.status === 'In Progress')
  const blocked = tasks.filter((t) => t.status === 'Waiting / Blocked')
  const completionRate = calcProgress(completed.length, tasks.length)

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const completedThisWeek = completed.filter((t) => t.completed_at && new Date(t.completed_at).getTime() >= sevenDaysAgo)

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
        <h1 className="text-2xl font-semibold text-ink-900">Studio overview</h1>
        <p className="mt-1 text-sm text-ink-500">Everything happening across the studio, at a glance.</p>
      </div>

      {/* Hero summary */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-6 text-white shadow-soft-lg sm:p-7">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: 'radial-gradient(circle at 90% -10%, rgba(255,255,255,0.25), transparent 55%)' }}
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-5">
            <CompletionRing value={completionRate} />
            <div>
              <p className="text-sm font-medium text-brand-100">Overall completion</p>
              <p className="mt-0.5 text-lg font-semibold">
                {completed.length} of {tasks.length} tasks done
              </p>
              <p className="mt-1 text-sm text-brand-100">{active.length} still active across the studio</p>
            </div>
          </div>
          <div className="grid w-full grid-cols-3 gap-3 sm:w-auto">
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-xl font-semibold">{overdue.length}</p>
              <p className="text-xs text-brand-100">Overdue</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-xl font-semibold">{dueToday.length}</p>
              <p className="text-xs text-brand-100">Due today</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center backdrop-blur-sm">
              <p className="text-xl font-semibold">{dueThisWeek.length}</p>
              <p className="text-xs text-brand-100">This week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Smaller metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard icon={ListTodo} label="Active tasks" value={active.length} tint="brand" />
        <StatCard icon={Clock} label="In progress" value={inProgress.length} tint="sky" />
        <StatCard icon={PauseCircle} label="Waiting / blocked" value={blocked.length} tint="amber" />
        <StatCard icon={CheckCircle2} label="Completed" value={completed.length} tint="emerald" />
        <StatCard icon={TrendingUp} label="Completed this week" value={completedThisWeek.length} tint="emerald" />
      </div>

      {/* Trends */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <CompletionTrendChart tasks={tasks} />
        <UpcomingWorkloadChart tasks={tasks} />
      </div>

      {/* Workload + project health */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ProgressByMember profiles={teamMembers} tasks={tasks} />
        <ProgressByFolder rootFolders={rootFolders} allFolders={folders} tasks={tasks} />
      </div>

      {/* Status distribution + overdue by project */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <StatusChart tasks={tasks} />
        <OverdueByProjectChart rootFolders={rootFolders} allFolders={folders} tasks={tasks} />
      </div>

      {/* Deadline attention */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <TaskMiniList
          title="Overdue — needs attention"
          tasks={overdueAttention}
          emptyIcon={CheckCircle2}
          emptyLabel="Nothing overdue. Great work!"
        />
        <TaskMiniList title="Upcoming deadlines" tasks={upcoming} emptyIcon={CalendarClock} emptyLabel="No upcoming deadlines." />
      </div>

      {/* Recent activity */}
      <TaskMiniList
        title="Recently completed"
        tasks={recentlyCompleted}
        dateField="completed_at"
        emptyIcon={Sun}
        emptyLabel="No completed tasks yet — they'll show up here as work wraps."
      />
    </div>
  )
}
