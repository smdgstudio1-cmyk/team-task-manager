import type { Task } from '@/lib/types'
import { TaskCard } from '../TaskCard'
import { isDueThisWeek, isDueToday, isOverdue } from '@/lib/utils'
import { EmptyState } from '@/components/ui/EmptyState'
import { CalendarClock } from 'lucide-react'

function Group({ title, tasks, onOpenTask, tint }: { title: string; tasks: Task[]; onOpenTask: (id: string) => void; tint?: string }) {
  if (tasks.length === 0) return null
  return (
    <div>
      <p className={`mb-2 text-sm font-semibold ${tint || 'text-ink-500'}`}>
        {title} ({tasks.length})
      </p>
      <div className="space-y-2">
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} />
        ))}
      </div>
    </div>
  )
}

export function TaskDeadlineView({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  const incomplete = tasks.filter((t) => t.status !== 'Completed')
  const overdue = incomplete.filter((t) => isOverdue(t))
  const dueToday = incomplete.filter((t) => !isOverdue(t) && isDueToday(t))
  const dueThisWeek = incomplete.filter((t) => !isOverdue(t) && !isDueToday(t) && isDueThisWeek(t))
  const later = incomplete.filter((t) => t.deadline && !overdue.includes(t) && !dueToday.includes(t) && !dueThisWeek.includes(t))
  const noDeadline = incomplete.filter((t) => !t.deadline)

  if (tasks.length === 0) {
    return <EmptyState icon={CalendarClock} title="No tasks yet" description="Tasks will appear here grouped by deadline." />
  }

  return (
    <div className="space-y-6">
      <Group title="Overdue" tasks={overdue} onOpenTask={onOpenTask} tint="text-red-600" />
      <Group title="Due today" tasks={dueToday} onOpenTask={onOpenTask} tint="text-amber-600" />
      <Group title="Due this week" tasks={dueThisWeek} onOpenTask={onOpenTask} />
      <Group title="Later" tasks={later} onOpenTask={onOpenTask} />
      <Group title="No deadline" tasks={noDeadline} onOpenTask={onOpenTask} />
    </div>
  )
}
