import { useNavigate } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { CompletionRing } from './CompletionRing'
import { ProgressByMember } from './ProgressByMember'
import { TaskMiniList } from './TaskMiniList'
import { calcProgress, isOverdue } from '@/lib/utils'

export function StudioDashboard() {
  const navigate = useNavigate()
  const allTasks = useDataStore((s) => s.tasks)
  const teamMembers = useDataStore((s) => s.teamMembers)
  const tasks = allTasks.filter((t) => !t.archived)

  const completed = tasks.filter((t) => t.status === 'Completed')
  const active = tasks.filter((t) => t.status !== 'Completed')
  const overdue = [...tasks.filter((t) => isOverdue(t))].sort(
    (a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime()
  )
  const completionRate = calcProgress(completed.length, tasks.length)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-50">Studio overview</h1>
        <p className="mt-1 text-sm text-ink-400">How the studio is doing, at a glance.</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-600 via-brand-600 to-brand-800 p-6 text-white shadow-soft-lg sm:p-8">
        <div
          className="pointer-events-none absolute inset-0 opacity-70"
          style={{ background: 'radial-gradient(circle at 90% -10%, rgba(255,255,255,0.25), transparent 55%)' }}
        />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <CompletionRing value={completionRate} size={112} />
          <div>
            <p className="text-sm font-medium text-brand-100">Overall completion</p>
            <p className="mt-1 text-2xl font-semibold">
              {completed.length} of {tasks.length} tasks done
            </p>
            <p className="mt-1 text-sm text-brand-100">{active.length} still active across the studio</p>
          </div>
        </div>
      </div>

      <ProgressByMember profiles={teamMembers} tasks={tasks} />

      <div>
        <TaskMiniList
          title={`Overdue tasks${overdue.length > 0 ? ` (${overdue.length})` : ''}`}
          tasks={overdue.slice(0, 6)}
          emptyIcon={CheckCircle2}
          emptyLabel="Nothing overdue. Great work!"
        />
        {overdue.length > 6 && (
          <button
            onClick={() => navigate('/overdue')}
            className="mt-2 flex items-center gap-1 text-sm font-medium text-brand-400 hover:text-brand-300"
          >
            View all {overdue.length} overdue tasks
            <ArrowRight size={14} />
          </button>
        )}
      </div>
    </div>
  )
}
