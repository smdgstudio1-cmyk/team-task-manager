import {
  Sparkles,
  RefreshCw,
  CalendarClock,
  Flag,
  UserCog,
  CheckCircle2,
  Archive,
  Paperclip,
  MessageSquare,
} from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { formatRelative } from '@/lib/utils'
import type { TaskActivityType } from '@/lib/types'

const ICONS: Record<TaskActivityType, typeof Sparkles> = {
  created: Sparkles,
  status_changed: RefreshCw,
  deadline_changed: CalendarClock,
  priority_changed: Flag,
  assignment_changed: UserCog,
  completed: CheckCircle2,
  archived: Archive,
  attachment_added: Paperclip,
  note_added: MessageSquare,
}

export function ActivityTimeline({ taskId }: { taskId: string }) {
  const activity = useDataStore((s) => s.activityByTask[taskId]) || []

  if (activity.length === 0) {
    return <p className="px-1 text-sm text-ink-400">No activity recorded yet.</p>
  }

  return (
    <div className="space-y-0.5">
      {activity.map((a, i) => {
        const Icon = ICONS[a.type] || Sparkles
        return (
          <div key={a.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
                <Icon size={13} />
              </div>
              {i < activity.length - 1 && <div className="w-px flex-1 bg-ink-100" />}
            </div>
            <div className="min-w-0 flex-1 pb-4">
              <p className="text-sm text-ink-700">{a.message}</p>
              <p className="mt-0.5 text-xs text-ink-400">{formatRelative(a.created_at)}</p>
            </div>
          </div>
        )
      })}
    </div>
  )
}
