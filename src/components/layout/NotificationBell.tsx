import { useState } from 'react'
import { Bell, Clock, AlertTriangle, CalendarClock, PauseCircle, CalendarDays } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { cx } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { NotificationType } from '@/lib/types'

const ICONS: Record<NotificationType, typeof Bell> = {
  due_today: CalendarDays,
  due_tomorrow: Clock,
  due_soon: CalendarClock,
  overdue: AlertTriangle,
  stale_blocked: PauseCircle,
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const notifications = useDataStore((s) => s.notifications)
  const markNotificationRead = useDataStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useDataStore((s) => s.markAllNotificationsRead)
  const tasks = useDataStore((s) => s.tasks)
  const navigate = useNavigate()

  const recent = notifications.slice(0, 20)
  const unreadCount = notifications.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 text-ink-400 hover:bg-white/8 hover:text-ink-100"
        aria-label="Notifications"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="glass animate-fade-in absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-white/10 shadow-soft-lg sm:w-96">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <p className="text-sm font-semibold text-ink-50">Notifications</p>
              {unreadCount > 0 && (
                <button onClick={() => markAllNotificationsRead()} className="text-xs font-medium text-brand-400 hover:text-brand-300">
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {recent.length === 0 && <p className="px-4 py-8 text-center text-sm text-ink-400">You're all caught up.</p>}
              {recent.map((n) => {
                const Icon = ICONS[n.type]
                const task = tasks.find((t) => t.id === n.related_task_id)
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id)
                      setOpen(false)
                      if (task) navigate(`/projects/${task.folder_id}?task=${task.id}`)
                      else navigate('/notifications')
                    }}
                    className={cx(
                      'flex w-full items-start gap-3 border-b border-white/5 px-4 py-3 text-left last:border-0 hover:bg-white/5',
                      !n.is_read && 'bg-brand-500/10'
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/8 text-ink-300">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-100">{n.message}</p>
                      <p className="mt-0.5 text-xs text-ink-500">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                )
              })}
            </div>
            <div className="border-t border-white/8 px-4 py-2 text-center">
              <button
                onClick={() => {
                  setOpen(false)
                  navigate('/notifications')
                }}
                className="text-xs font-medium text-ink-400 hover:text-ink-100"
              >
                View all
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
