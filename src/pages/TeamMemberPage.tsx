import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, FolderPlus, FolderKanban, AlertTriangle, Users } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderFormModal } from '@/components/folders/FolderFormModal'
import { getFolderStats } from '@/lib/folderStats'
import { calcProgress, isOverdue } from '@/lib/utils'

export function TeamMemberPage() {
  const { memberId } = useParams()
  const navigate = useNavigate()
  const teamMembers = useDataStore((s) => s.teamMembers)
  const folders = useDataStore((s) => s.folders)
  const tasks = useDataStore((s) => s.tasks)
  const [creatingProject, setCreatingProject] = useState(false)

  const member = teamMembers.find((m) => m.id === memberId)

  if (!member) {
    return (
      <EmptyState
        icon={Users}
        title="Team member not found"
        description="They may have been removed, or the link is out of date."
        action={
          <Button size="sm" variant="secondary" onClick={() => navigate('/team')}>
            Back to Team
          </Button>
        }
      />
    )
  }

  const mine = tasks.filter((t) => t.assigned_user_id === member.id && !t.archived)
  const completed = mine.filter((t) => t.status === 'Completed').length
  const overdue = mine.filter((t) => isOverdue(t)).length
  const progress = calcProgress(completed, mine.length)
  const projects = folders.filter((f) => f.owner_id === member.id && f.parent_folder_id === null)

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate('/team')}
        className="flex items-center gap-1.5 text-sm text-ink-400 hover:text-ink-100"
      >
        <ArrowLeft size={15} />
        Team
      </button>

      <Card>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={member.name} size="lg" className="h-14 w-14 text-lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold text-ink-50">{member.name}</h1>
            <p className="text-sm text-ink-400">{member.title || 'Team member'}</p>
          </div>
          {overdue > 0 && (
            <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-red-500/15 px-3 py-1.5 text-sm font-semibold text-red-400">
              <AlertTriangle size={14} />
              {overdue} overdue
            </span>
          )}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-4 border-t border-white/8 pt-5">
          <div>
            <p className="text-xs font-medium text-ink-500">Active tasks</p>
            <p className="mt-1 text-lg font-semibold text-ink-50">{mine.length - completed}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Completed</p>
            <p className="mt-1 text-lg font-semibold text-ink-50">{completed}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Overall progress</p>
            <p className="mt-1 text-lg font-semibold text-ink-50">{progress}%</p>
          </div>
        </div>
        <ProgressBar value={progress} className="mt-4" />
      </Card>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-ink-50">Projects</h2>
        <Button size="sm" onClick={() => setCreatingProject(true)}>
          <FolderPlus size={15} />
          New project
        </Button>
      </div>

      {projects.length === 0 ? (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description={`Create ${member.name}'s first project to start organizing lists and tasks.`}
          action={
            <Button size="sm" onClick={() => setCreatingProject(true)}>
              <FolderPlus size={15} />
              New project
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const stats = getFolderStats(p.id, folders, tasks)
            return (
              <button key={p.id} onClick={() => navigate(`/projects/${p.id}`)} className="text-left">
                <Card className="transition-all hover:-translate-y-px hover:shadow-soft-lg">
                  <div className="flex items-center gap-2">
                    <FolderKanban size={16} className="text-brand-400" />
                    <p className="truncate text-sm font-semibold text-ink-50">{p.name}</p>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                    <span>{stats.active} active</span>
                    <span className="font-semibold text-ink-100">{stats.progress}%</span>
                  </div>
                  <ProgressBar value={stats.progress} size="sm" className="mt-1.5" />
                </Card>
              </button>
            )
          })}
        </div>
      )}

      <FolderFormModal open={creatingProject} onClose={() => setCreatingProject(false)} ownerId={member.id} />
    </div>
  )
}
