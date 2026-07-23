import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Users, CalendarDays, Settings, Sparkles, LogOut } from 'lucide-react'
import { cx } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'

const NAV_ITEMS: { to: string; label: string; icon: typeof LayoutDashboard }[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/team', label: 'Team', icon: Users },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
]

function navClass({ isActive }: { isActive: boolean }) {
  return cx(
    'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
    isActive ? 'bg-white/8 text-ink-50' : 'text-ink-400 hover:bg-white/5 hover:text-ink-200'
  )
}

export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const adminUser = useAuthStore((s) => s.adminUser)
  const signOut = useAuthStore((s) => s.signOut)

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-white shadow-soft">
          <Sparkles size={18} />
        </div>
        <div>
          <span className="block text-base font-semibold leading-tight text-ink-50">Lumen Studio</span>
          <span className="block text-xs leading-tight text-ink-500">Studio management</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 pt-2">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.to} to={item.to} onClick={onNavigate} className={navClass}>
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-brand-500" />}
                <item.icon size={18} />
                {item.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-3">
        <NavLink to="/settings" onClick={onNavigate} className={navClass}>
          <Settings size={18} />
          Settings
        </NavLink>
      </div>

      {adminUser && (
        <div className="mx-3 mb-4 flex items-center gap-2 rounded-xl bg-white/5 px-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-ink-500">Signed in as</p>
            <p className="truncate text-sm font-semibold text-ink-100">{adminUser.email}</p>
          </div>
          <button
            onClick={signOut}
            className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-white/8 hover:text-ink-100"
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
