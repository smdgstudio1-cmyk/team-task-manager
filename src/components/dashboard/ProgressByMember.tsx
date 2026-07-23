import { useNavigate } from 'react-router-dom'
import { Users } from 'lucide-react'
import type { TeamMember, Task } from '@/lib/types'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { calcProgress, isOverdue } from '@/lib/utils'

export function ProgressByMember({ profiles, tasks }: { profiles: TeamMember[]; tasks: Task[] }) {
  const navigate = useNavigate()
  const active = profiles.filter((p) => !p.archived)

  const rows = active
    .map((p) => {
      const mine = tasks.filter((t) => t.assigned_user_id === p.id)
      const completed = mine.filter((t) => t.status === 'Completed').length
      const overdue = mine.filter((t) => isOverdue(t)).length
      const workload = mine.length - completed
      return { member: p, total: mine.length, completed, overdue, workload, progress: calcProgress(completed, mine.length) }
    })
    .sort((a, b) => b.workload - a.workload)

  const busiest = rows[0]?.workload > 0 ? rows[0] : null

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-100">Workload by team member</h3>
        {busiest && (
          <span className="rounded-full bg-clay-500/15 px-2.5 py-1 text-xs font-medium text-clay-400">
            {busiest.member.name.split(' ')[0]} has the most on their plate
          </span>
        )}
      </div>
      <div className="space-y-4">
        {rows.map((r) => (
          <div key={r.member.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <button
                onClick={() => navigate(`/team/${r.member.id}`)}
                className="flex min-w-0 items-center gap-2.5"
              >
                <Avatar name={r.member.name} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink-100">{r.member.name}</span>
                  {r.member.title && <span className="block truncate text-xs text-ink-500">{r.member.title}</span>}
                </span>
              </button>
              <div className="flex shrink-0 items-center gap-2 text-xs text-ink-400">
                <span>{r.workload} active</span>
                {r.overdue > 0 && <span className="font-semibold text-red-400">{r.overdue} overdue</span>}
                <span className="w-9 text-right font-semibold text-ink-100">{r.progress}%</span>
              </div>
            </div>
            <ProgressBar value={r.progress} size="sm" colorClassName={r.overdue > 0 ? 'bg-red-400' : 'bg-brand-500'} />
          </div>
        ))}
        {rows.length === 0 && (
          <EmptyState
            icon={Users}
            title="No team members yet"
            description="Add people to your studio to start assigning work."
          />
        )}
      </div>
    </Card>
  )
}
