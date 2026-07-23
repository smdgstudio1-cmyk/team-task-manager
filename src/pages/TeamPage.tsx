import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { UserPlus, AlertTriangle, Pencil, Archive, ArchiveRestore, ChevronDown, ChevronRight, Users } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { CreateMemberModal } from '@/components/dashboard/CreateMemberModal'
import { calcProgress, cx, isOverdue } from '@/lib/utils'
import { toast } from '@/store/toastStore'
import type { TeamMember } from '@/lib/types'

export function TeamPage() {
  const teamMembers = useDataStore((s) => s.teamMembers)
  const tasks = useDataStore((s) => s.tasks)
  const updateTeamMember = useDataStore((s) => s.updateTeamMember)
  const navigate = useNavigate()
  const [creating, setCreating] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  const active = teamMembers.filter((m) => !m.archived)
  const archived = teamMembers.filter((m) => m.archived)

  function renderCard(p: TeamMember) {
    const mine = tasks.filter((t) => t.assigned_user_id === p.id && !t.archived)
    const completed = mine.filter((t) => t.status === 'Completed').length
    const overdue = mine.filter((t) => isOverdue(t)).length
    const progress = calcProgress(completed, mine.length)

    return (
      <Card key={p.id} className="group transition-all hover:-translate-y-px hover:shadow-soft-lg">
        <button onClick={() => navigate(`/team/${p.id}`)} className="flex w-full items-center gap-3 text-left">
          <Avatar name={p.name} size="lg" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink-50">{p.name}</p>
            <p className="truncate text-xs text-ink-400">{p.title || 'Team member'}</p>
          </div>
          {overdue > 0 && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-red-500/15 px-2 py-1 text-xs font-semibold text-red-400">
              <AlertTriangle size={12} />
              {overdue}
            </span>
          )}
        </button>
        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-ink-400">
            <span>
              {mine.length - completed} active {mine.length - completed === 1 ? 'task' : 'tasks'}
            </span>
            <span className="font-semibold text-ink-100">{progress}%</span>
          </div>
          <ProgressBar value={progress} size="sm" />
        </div>
        <div className="mt-3 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <button
            onClick={() => setEditingMember(p)}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-400 hover:bg-white/8"
          >
            <Pencil size={12} />
            Edit
          </button>
          <button
            onClick={() => {
              updateTeamMember(p.id, { archived: !p.archived })
              toast.success(p.archived ? `${p.name} restored` : `${p.name} archived`)
            }}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-400 hover:bg-white/8"
          >
            {p.archived ? <ArchiveRestore size={12} /> : <Archive size={12} />}
            {p.archived ? 'Restore' : 'Archive'}
          </button>
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-50">Team</h1>
          <p className="mt-1 text-sm text-ink-400">
            {active.length} {active.length === 1 ? 'person' : 'people'} at Lumen Studio.
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <UserPlus size={15} />
          Add member
        </Button>
      </div>

      {active.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No team members yet"
          description="Add the people on your studio team so you can assign tasks and track their workload."
          action={
            <Button size="sm" onClick={() => setCreating(true)}>
              <UserPlus size={15} />
              Add member
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{active.map(renderCard)}</div>
      )}

      {archived.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((s) => !s)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-400 hover:text-ink-100"
          >
            {showArchived ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Archived ({archived.length})
          </button>
          {showArchived && <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{archived.map(renderCard)}</div>}
        </div>
      )}

      <CreateMemberModal open={creating} onClose={() => setCreating(false)} />
      <CreateMemberModal open={!!editingMember} onClose={() => setEditingMember(null)} member={editingMember} />
    </div>
  )
}
