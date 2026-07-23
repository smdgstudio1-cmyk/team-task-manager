import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ListChecks,
  Users,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  CalendarDays,
  Settings,
  Sparkles,
  LogOut,
} from 'lucide-react'
import { cx, isOverdue } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'

const NAV_GROUPS: { label: string; items: { to: string; label: string; icon: typeof LayoutDashboard }[] }[] = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/my-tasks', label: 'My Studio Tasks', icon: ListChecks },
    ],
  },
  {
    label: 'Organize',
    items: [
      { to: '/team', label: 'Team', icon: Users },
      { to: '/folders', label: 'Projects', icon: FolderKanban },
      { to: '/calendar', label: 'Calendar', icon: CalendarDays },
    ],
  },
  {
    label: 'Attention',
    items: [
      { to: '/overdue', label: 'Overdue', icon: AlertTriangle },
      { to: '/completed', label: 'Completed', icon: CheckCircle2 },
    ],
  },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const adminUser = useAuthStore((s) => s.adminUser)
  const signOut = useAuthStore((s) => s.signOut)
  const tasks = useDataStore((s) => s.tasks)

  const overdueCount = tasks.filter((t) => isOverdue(t)).length

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
          <Sparkles size={18} />
        </div>
        <div>
          <span className="block text-base font-semibold leading-tight text-ink-900">Lumen Studio</span>
          <span className="block text-xs leading-tight text-ink-400">Studio management</span>
        </div>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto px-3 pt-1">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <p className="mb-1.5 px-3 text-xs font-medium text-ink-400">{group.label}</p>
            <div className="space-y-0.5">
              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cx(
                      'relative flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                      isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
                    )
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />}
                      <span className="flex items-center gap-3">
                        <item.icon size={18} />
                        {item.label}
                      </span>
                      {item.to === '/overdue' && overdueCount > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          {overdueCount}
                        </span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <NavLink
          to="/settings"
          onClick={onNavigate}
          className={({ isActive }) =>
            cx(
              'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
            )
          }
        >
          <Settings size={18} />
          Settings
        </NavLink>
      </div>

      {adminUser && (
        <div className="mx-3 mb-4 flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-ink-400">Signed in as</p>
            <p className="truncate text-sm font-semibold text-ink-900">{adminUser.email}</p>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-ink-200 hover:text-ink-700"
            title="Sign out"
            aria-label="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      )}
    </div>
  )
}
