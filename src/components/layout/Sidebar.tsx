import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  ListChecks,
  Users,
  FolderKanban,
  AlertTriangle,
  CheckCircle2,
  Settings,
  Sparkles,
} from 'lucide-react'
import { cx } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { isOverdue } from '@/lib/utils'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/my-tasks', label: 'My Tasks', icon: ListChecks },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/folders', label: 'Projects', icon: FolderKanban },
  { to: '/overdue', label: 'Overdue', icon: AlertTriangle },
  { to: '/completed', label: 'Completed', icon: CheckCircle2 },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const tasks = useDataStore((s) => s.tasks)

  const overdueCount = profile
    ? tasks.filter((t) => isOverdue(t) && (profile.role === 'admin' || t.assigned_user_id === profile.id)).length
    : 0

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 px-5 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white">
          <Sparkles size={17} />
        </div>
        <span className="text-base font-semibold text-ink-900">Lumen Studio</span>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={({ isActive }) =>
              cx(
                'flex items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-100'
              )
            }
          >
            <span className="flex items-center gap-3">
              <item.icon size={18} />
              {item.label}
            </span>
            {item.to === '/overdue' && overdueCount > 0 && (
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                {overdueCount}
              </span>
            )}
          </NavLink>
        ))}
      </nav>

      {profile && (
        <div className="mx-3 mb-4 rounded-xl bg-ink-50 px-3 py-3">
          <p className="text-xs font-medium text-ink-500">Signed in as</p>
          <p className="truncate text-sm font-semibold text-ink-900">{profile.name}</p>
          <p className="truncate text-xs text-ink-500">{profile.role === 'admin' ? 'Project Manager' : 'Team Member'}</p>
        </div>
      )}
    </div>
  )
}
