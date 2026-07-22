import { Menu, LogOut } from 'lucide-react'
import { useState } from 'react'
import { Avatar } from '@/components/ui/Avatar'
import { NotificationBell } from './NotificationBell'
import { GlobalSearch } from './GlobalSearch'
import { useAuthStore } from '@/store/authStore'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  const profile = useAuthStore((s) => s.profile)
  const signOut = useAuthStore((s) => s.signOut)
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-ink-200 bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-600 hover:bg-ink-100 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <NotificationBell />

      {profile && (
        <div className="relative">
          <button onClick={() => setMenuOpen((o) => !o)} className="flex items-center gap-2">
            <Avatar name={profile.name} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setMenuOpen(false)} />
              <div className="animate-fade-in absolute right-0 z-40 mt-2 w-52 rounded-xl border border-ink-200 bg-white p-1.5 shadow-xl">
                <div className="px-3 py-2">
                  <p className="truncate text-sm font-semibold text-ink-900">{profile.name}</p>
                  <p className="truncate text-xs text-ink-500">{profile.email}</p>
                </div>
                <div className="my-1 h-px bg-ink-100" />
                <button
                  onClick={signOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut size={15} />
                  Sign out
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </header>
  )
}
