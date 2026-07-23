import { Menu } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'
import { NotificationBell } from './NotificationBell'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="glass sticky top-0 z-20 flex items-center gap-3 border-b border-white/8 px-4 py-3 sm:px-6">
      <button
        onClick={onMenuClick}
        className="rounded-lg p-2 text-ink-300 hover:bg-white/8 lg:hidden"
        aria-label="Open menu"
      >
        <Menu size={20} />
      </button>

      <div className="flex-1">
        <GlobalSearch />
      </div>

      <NotificationBell />
    </header>
  )
}
