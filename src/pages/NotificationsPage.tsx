import { Clock, AlertTriangle, CalendarClock, PauseCircle, CalendarDays, BellOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { cx, formatDate } from '@/lib/utils'
import type { NotificationType } from '@/lib/types'

const ICONS: Record<NotificationType, typeof Clock> = {
  due_today: CalendarDays,
  due_tomorrow: Clock,
  due_soon: CalendarClock,
  overdue: AlertTriangle,
  stale_blocked: PauseCircle,
}

export function NotificationsPage() {
  const notifications = useDataStore((s) => s.notifications)
  const tasks = useDataStore((s) => s.tasks)
  const markNotificationRead = useDataStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useDataStore((s) => s.markAllNotificationsRead)
  const navigate = useNavigate()

  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Notifications</h1>
          <p className="mt-1 text-sm text-ink-500">Deadline alerts and stale-task reminders.</p>
        </div>
        {unreadCount > 0 && (
          <Button size="sm" variant="secondary" onClick={() => markAllNotificationsRead()}>
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <EmptyState icon={BellOff} title="No notifications" description="You'll see deadline alerts and reminders here as they come up." />
      ) : (
        <Card className="p-0">
          {notifications.map((n) => {
            const Icon = ICONS[n.type]
            const task = tasks.find((t) => t.id === n.related_task_id)
            return (
              <button
                key={n.id}
                onClick={() => {
                  markNotificationRead(n.id)
                  if (task) navigate(`/folders/${task.folder_id}?task=${task.id}`)
                }}
                className={cx(
                  'flex w-full items-start gap-3 border-b border-ink-100 px-5 py-4 text-left last:border-0 hover:bg-ink-50',
                  !n.is_read && 'bg-brand-50/40'
                )}
              >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink-800">{n.message}</p>
                  <p className="mt-0.5 text-xs text-ink-400">{formatDate(n.created_at)}</p>
                </div>
                {!n.is_read && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
              </button>
            )
          })}
        </Card>
      )}
    </div>
  )
}
