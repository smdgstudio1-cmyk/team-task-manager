import { Menu } from 'lucide-react'
import { GlobalSearch } from './GlobalSearch'

export function Topbar({ onMenuClick }: { onMenuClick: () => void }) {
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
    </header>
  )
}
