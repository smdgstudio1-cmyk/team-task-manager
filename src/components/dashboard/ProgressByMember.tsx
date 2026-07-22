import { useNavigate } from 'react-router-dom'
import type { Profile, Task } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card } from '@/components/ui/Card'
import { calcProgress, isOverdue } from '@/lib/utils'

export function ProgressByMember({ profiles, tasks }: { profiles: Profile[]; tasks: Task[] }) {
  const navigate = useNavigate()

  const rows = profiles
    .map((p) => {
      const mine = tasks.filter((t) => t.assigned_user_id === p.id)
      const completed = mine.filter((t) => t.status === 'Completed').length
      const overdue = mine.filter((t) => isOverdue(t)).length
      const active = mine.length - completed
      return { profile: p, total: mine.length, completed, overdue, active, progress: calcProgress(completed, mine.length) }
    })
    .sort((a, b) => b.active - a.active)

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-ink-800">Progress by team member</h3>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.profile.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <button
                onClick={() => navigate(`/team?member=${r.profile.id}`)}
                className="flex min-w-0 items-center gap-2"
              >
                <Avatar name={r.profile.name} size="sm" />
                <span className="truncate text-sm font-medium text-ink-800">{r.profile.name}</span>
              </button>
              <div className="flex shrink-0 items-center gap-2 text-xs text-ink-500">
                <span>{r.active} active</span>
                {r.overdue > 0 && <span className="font-semibold text-red-600">{r.overdue} overdue</span>}
                <span className="font-semibold text-ink-800">{r.progress}%</span>
              </div>
            </div>
            <ProgressBar value={r.progress} size="sm" colorClassName={r.overdue > 0 ? 'bg-red-400' : 'bg-brand-500'} />
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-ink-400">No team members yet.</p>}
      </div>
    </Card>
  )
}
