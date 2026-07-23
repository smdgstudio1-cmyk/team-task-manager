import { useEffect } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { TeamPage } from '@/pages/TeamPage'
import { TeamMemberPage } from '@/pages/TeamMemberPage'
import { ProjectPage } from '@/pages/ProjectPage'
import { OverduePage } from '@/pages/OverduePage'
import { CalendarPage } from '@/pages/CalendarPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { ToastHost } from '@/components/ui/ToastHost'

function FullScreenLoader() {
  return (
    <div className="flex h-screen items-center justify-center text-sm text-ink-400">
      Loading...
    </div>
  )
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const adminUser = useAuthStore((s) => s.adminUser)
  const loading = useAuthStore((s) => s.loading)
  if (loading) return <FullScreenLoader />
  if (!adminUser) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const initialize = useAuthStore((s) => s.initialize)
  const adminUser = useAuthStore((s) => s.adminUser)
  const loading = useAuthStore((s) => s.loading)

  useEffect(() => {
    initialize()
  }, [initialize])

  return (
    <BrowserRouter>
      <ToastHost />
      <Routes>
        <Route
          path="/login"
          element={loading ? <FullScreenLoader /> : adminUser ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          element={
            <RequireAuth>
              <AppShell />
            </RequireAuth>
          }
        >
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/team/:memberId" element={<TeamMemberPage />} />
          <Route path="/projects/:projectId" element={<ProjectPage />} />
          <Route path="/overdue" element={<OverduePage />} />
          <Route path="/calendar" element={<CalendarPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
