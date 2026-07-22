import { useAuthStore } from '@/store/authStore'
import { AdminDashboard } from '@/components/dashboard/AdminDashboard'
import { PersonalDashboard } from '@/components/dashboard/PersonalDashboard'

export function DashboardPage() {
  const profile = useAuthStore((s) => s.profile)
  if (!profile) return null
  return profile.role === 'admin' ? <AdminDashboard /> : <PersonalDashboard profileId={profile.id} />
}
