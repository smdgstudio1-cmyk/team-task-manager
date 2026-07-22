import { useState } from 'react'
import { Bell, UserPlus, Clock, AlertTriangle, CheckCircle2, RefreshCw, MessageSquare } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { cx } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'
import type { NotificationType } from '@/lib/types'

const ICONS: Record<NotificationType, typeof Bell> = {
  assigned: UserPlus,
  deadline_approaching: Clock,
  overdue: AlertTriangle,
  completed: CheckCircle2,
  status_changed: RefreshCw,
  note_added: MessageSquare,
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
  const profile = useAuthStore((s) => s.profile)
  const notifications = useDataStore((s) => s.notifications)
  const markNotificationRead = useDataStore((s) => s.markNotificationRead)
  const markAllNotificationsRead = useDataStore((s) => s.markAllNotificationsRead)
  const navigate = useNavigate()

  if (!profile) return null

  const mine = notifications.filter((n) => n.user_id === profile.id).slice(0, 20)
  const unreadCount = mine.filter((n) => !n.is_read).length

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative rounded-xl p-2.5 text-ink-500 hover:bg-ink-100 hover:text-ink-800"
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
          <div className="animate-fade-in absolute right-0 z-40 mt-2 w-80 rounded-2xl border border-ink-200 bg-white shadow-xl sm:w-96">
            <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
              <p className="text-sm font-semibold text-ink-900">Notifications</p>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllNotificationsRead(profile.id)}
                  className="text-xs font-medium text-brand-600 hover:text-brand-700"
                >
                  Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {mine.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-ink-400">You're all caught up.</p>
              )}
              {mine.map((n) => {
                const Icon = ICONS[n.type]
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      markNotificationRead(n.id)
                      setOpen(false)
                      navigate('/notifications')
                    }}
                    className={cx(
                      'flex w-full items-start gap-3 border-b border-ink-50 px-4 py-3 text-left last:border-0 hover:bg-ink-50',
                      !n.is_read && 'bg-brand-50/40'
                    )}
                  >
                    <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink-100 text-ink-500">
                      <Icon size={15} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-ink-800">{n.message}</p>
                      <p className="mt-0.5 text-xs text-ink-400">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />}
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
