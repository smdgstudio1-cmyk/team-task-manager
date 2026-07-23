import { CalendarClock } from 'lucide-react'
import type { Task } from '@/lib/types'
import { StatusBadge, OverdueBadge } from '@/components/ui/Badge'
import { formatRelative, isOverdue } from '@/lib/utils'
import { useDataStore } from '@/store/dataStore'
import { Avatar } from '@/components/ui/Avatar'

export function UpcomingDeadlinesPanel({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  const teamMembers = useDataStore((s) => s.teamMembers)

  const upcoming = [...tasks]
    .filter((t) => t.deadline && t.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())
    .slice(0, 8)

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-800 p-4 shadow-soft">
      <h3 className="mb-3 text-sm font-semibold text-ink-100">Upcoming deadlines</h3>
      {upcoming.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-white/5 px-3 py-4 text-sm text-ink-400">
          <CalendarClock size={16} className="shrink-0 text-ink-400" />
          Nothing on the horizon.
        </div>
      ) : (
        <div className="space-y-1">
          {upcoming.map((t) => {
            const assignee = teamMembers.find((m) => m.id === t.assigned_user_id)
            return (
              <button
                key={t.id}
                onClick={() => onOpenTask(t.id)}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-white/5"
              >
                {assignee && <Avatar name={assignee.name} size="sm" className="shrink-0" />}
                <span className="min-w-0 flex-1 truncate text-sm text-ink-100">{t.title}</span>
                <span className="shrink-0 text-xs text-ink-500">{formatRelative(t.deadline)}</span>
              </button>
            )
          })}
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2 border-t border-white/8 pt-3">
        <StatusBadge status="In Progress" />
        <StatusBadge status="Waiting / Blocked" />
        <OverdueBadge />
        <StatusBadge status="Completed" />
      </div>
      <p className="mt-2 text-xs text-ink-500">Chip colors on the calendar match these statuses.</p>
    </div>
  )
}
