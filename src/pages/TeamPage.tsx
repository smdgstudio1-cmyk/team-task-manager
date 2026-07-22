import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { UserPlus, AlertTriangle } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { CreateMemberModal } from '@/components/dashboard/CreateMemberModal'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'
import { calcProgress, cx, isOverdue } from '@/lib/utils'

export function TeamPage() {
  const profile = useAuthStore((s) => s.profile)
  const profiles = useDataStore((s) => s.profiles)
  const tasks = useDataStore((s) => s.tasks)
  const [creating, setCreating] = useState(false)
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedMemberId = searchParams.get('member')

  if (!profile) return null
  const isAdmin = profile.role === 'admin'

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-900">Team</h1>
          <p className="mt-1 text-sm text-ink-500">{profiles.length} people at Lumen Studio.</p>
        </div>
        {isAdmin && (
          <Button size="sm" onClick={() => setCreating(true)}>
            <UserPlus size={15} />
            Add member
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {profiles.map((p) => {
          const mine = tasks.filter((t) => t.assigned_user_id === p.id)
          const completed = mine.filter((t) => t.status === 'Completed').length
          const overdue = mine.filter((t) => isOverdue(t)).length
          const progress = calcProgress(completed, mine.length)
          const selected = selectedMemberId === p.id

          return (
            <button
              key={p.id}
              onClick={() => setSearchParams(selected ? {} : { member: p.id })}
              className="text-left"
            >
              <Card className={cx('transition-shadow hover:shadow-md', selected && 'ring-2 ring-brand-400')}>
                <div className="flex items-center gap-3">
                  <Avatar name={p.name} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink-900">{p.name}</p>
                    <p className="truncate text-xs text-ink-500">{p.role === 'admin' ? 'Project Manager' : 'Team Member'}</p>
                  </div>
                  {overdue > 0 && (
                    <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-600">
                      <AlertTriangle size={12} />
                      {overdue}
                    </span>
                  )}
                </div>
                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-ink-500">
                    <span>{mine.length - completed} active tasks</span>
                    <span className="font-semibold text-ink-800">{progress}%</span>
                  </div>
                  <ProgressBar value={progress} size="sm" />
                </div>
              </Card>
            </button>
          )
        })}
      </div>

      {selectedMemberId && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-ink-900">
            {profiles.find((p) => p.id === selectedMemberId)?.name}'s tasks
          </h2>
          <TaskExplorer
            tasks={tasks.filter((t) => t.assigned_user_id === selectedMemberId)}
            showAssigneeFilter={false}
          />
        </div>
      )}

      <CreateMemberModal open={creating} onClose={() => setCreating(false)} />
    </div>
  )
}
