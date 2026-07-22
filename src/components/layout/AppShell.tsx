import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { X } from 'lucide-react'
import { SidebarContent } from './Sidebar'
import { Topbar } from './Topbar'
import { useDataStore } from '@/store/dataStore'
import { useAuthStore } from '@/store/authStore'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const loadAll = useDataStore((s) => s.loadAll)
  const subscribeRealtime = useDataStore((s) => s.subscribeRealtime)
  const loaded = useDataStore((s) => s.loaded)
  const generateDeadlineNotifications = useDataStore((s) => s.generateDeadlineNotifications)
  const profile = useAuthStore((s) => s.profile)

  useEffect(() => {
    loadAll().then(() => subscribeRealtime())
  }, [loadAll, subscribeRealtime])

  useEffect(() => {
    if (loaded && profile) {
      generateDeadlineNotifications(profile.id, profile.role === 'admin')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, profile?.id])

  return (
    <div className="flex h-screen overflow-hidden bg-ink-50">
      <aside className="hidden w-64 shrink-0 border-r border-ink-200 bg-white lg:block">
        <SidebarContent />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink-900/40" onClick={() => setMobileOpen(false)} />
          <div className="animate-slide-in absolute left-0 top-0 h-full w-72 bg-white shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-4 rounded-lg p-1.5 text-ink-400 hover:bg-ink-100"
            >
              <X size={18} />
            </button>
            <SidebarContent onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 sm:py-6">
          {!loaded ? (
            <div className="flex h-64 items-center justify-center text-sm text-ink-400">Loading workspace...</div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  )
}
