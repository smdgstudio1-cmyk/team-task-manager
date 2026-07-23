import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, FolderKanban, Pencil, Plus, Trash2, CalendarClock, List, Kanban } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { getChildFolders, getFolderPath, getFolderStats, getTasksForFolderTree } from '@/lib/folderStats'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderFormModal } from '@/components/folders/FolderFormModal'
import { TaskListSection, NewTaskListInline } from '@/components/folders/TaskListSection'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskKanbanView } from '@/components/tasks/views/TaskKanbanView'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelative, cx } from '@/lib/utils'
import { toast } from '@/store/toastStore'

type ViewMode = 'list' | 'board'

export function ProjectPage() {
  const { projectId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const folders = useDataStore((s) => s.folders)
  const taskLists = useDataStore((s) => s.taskLists)
  const tasks = useDataStore((s) => s.tasks)
  const teamMembers = useDataStore((s) => s.teamMembers)
  const deleteFolder = useDataStore((s) => s.deleteFolder)

  const [view, setView] = useState<ViewMode>('list')
  const [renaming, setRenaming] = useState(false)
  const [addingWorkstream, setAddingWorkstream] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(searchParams.get('task'))
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const folder = folders.find((f) => f.id === projectId)

  if (!folder) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Project not found"
        description="It may have been deleted, or the link is out of date."
        action={
          <Button size="sm" variant="secondary" onClick={() => navigate('/team')}>
            Back to Team
          </Button>
        }
      />
    )
  }

  const owner = teamMembers.find((p) => p.id === folder.owner_id)
  const path = getFolderPath(folder.id, folders)
  const stats = getFolderStats(folder.id, folders, tasks)
  const workstreams = getChildFolders(folder.id, folders)
  const listsHere = taskLists.filter((tl) => tl.folder_id === folder.id)
  const directTasks = tasks.filter((t) => t.folder_id === folder.id && !t.archived)
  const unlistedTasks = directTasks.filter((t) => !t.task_list_id)
  const allDescendantTasks = getTasksForFolderTree(folder.id, folders, tasks)

  const nextDeadline = allDescendantTasks
    .filter((t) => t.deadline && t.status !== 'Completed')
    .sort((a, b) => new Date(a.deadline!).getTime() - new Date(b.deadline!).getTime())[0]

  async function handleDelete() {
    await deleteFolder(folder!.id)
    toast.success(`"${folder!.name}" deleted`)
    if (folder!.parent_folder_id) navigate(`/projects/${folder!.parent_folder_id}`)
    else if (owner) navigate(`/team/${owner.id}`)
    else navigate('/team')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1 text-sm text-ink-400">
        {owner ? (
          <button onClick={() => navigate(`/team/${owner.id}`)} className="hover:text-ink-100">
            {owner.name}
          </button>
        ) : (
          <button onClick={() => navigate('/team')} className="hover:text-ink-100">
            Team
          </button>
        )}
        {path.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight size={13} />
            {i === path.length - 1 ? (
              <span className="font-medium text-ink-200">{f.name}</span>
            ) : (
              <button onClick={() => navigate(`/projects/${f.id}`)} className="hover:text-ink-100">
                {f.name}
              </button>
            )}
          </span>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-ink-50">{folder.name}</h1>
            {folder.description && <p className="mt-1 text-sm text-ink-400">{folder.description}</p>}
            {owner && (
              <div className="mt-3 flex items-center gap-2">
                <Avatar name={owner.name} size="sm" />
                <span className="text-xs text-ink-400">{owner.name}'s project</span>
              </div>
            )}
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button size="sm" onClick={() => setCreatingTask(true)}>
              <Plus size={14} />
              Task
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAddingWorkstream(true)}>
              <Plus size={14} />
              Workstream
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRenaming(true)} aria-label="Rename project">
              <Pencil size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              className="text-red-400 hover:bg-red-500/10"
              aria-label="Delete project"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <p className="text-xs font-medium text-ink-500">Overall progress</p>
            <p className="mt-1 text-lg font-semibold text-ink-50">{stats.progress}%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Active tasks</p>
            <p className="mt-1 text-lg font-semibold text-ink-50">{stats.active}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Completed</p>
            <p className="mt-1 text-lg font-semibold text-ink-50">{stats.completed}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Overdue</p>
            <p className={cx('mt-1 text-lg font-semibold', stats.overdue > 0 ? 'text-red-400' : 'text-ink-50')}>{stats.overdue}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-500">Next deadline</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-ink-50">
              <CalendarClock size={14} className="text-ink-400" />
              {nextDeadline ? formatRelative(nextDeadline.deadline) : '—'}
            </p>
          </div>
        </div>
        <ProgressBar value={stats.progress} className="mt-4" />
      </Card>

      {workstreams.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-200">Workstreams</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {workstreams.map((sf) => {
              const sfStats = getFolderStats(sf.id, folders, tasks)
              return (
                <button key={sf.id} onClick={() => navigate(`/projects/${sf.id}`)} className="text-left">
                  <Card className="transition-all hover:-translate-y-px hover:shadow-soft-lg">
                    <div className="flex items-center gap-2">
                      <FolderKanban size={16} className="text-brand-400" />
                      <p className="truncate text-sm font-semibold text-ink-50">{sf.name}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-400">
                      <span>{sfStats.active} active</span>
                      <span className="font-semibold text-ink-100">{sfStats.progress}%</span>
                    </div>
                    <ProgressBar value={sfStats.progress} size="sm" className="mt-1.5" />
                  </Card>
                </button>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-ink-200">Lists</h2>
        <div className="flex rounded-xl bg-white/5 p-1">
          <button
            onClick={() => setView('list')}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'list' ? 'bg-white/10 text-ink-50' : 'text-ink-400 hover:text-ink-200'
            )}
          >
            <List size={14} />
            List
          </button>
          <button
            onClick={() => setView('board')}
            className={cx(
              'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
              view === 'board' ? 'bg-white/10 text-ink-50' : 'text-ink-400 hover:text-ink-200'
            )}
          >
            <Kanban size={14} />
            Board
          </button>
        </div>
      </div>

      {view === 'board' ? (
        <TaskKanbanView tasks={directTasks} onOpenTask={setOpenTaskId} />
      ) : (
        <div className="space-y-3">
          {listsHere.map((list) => (
            <TaskListSection key={list.id} list={list} tasks={directTasks.filter((t) => t.task_list_id === list.id)} canManage />
          ))}

          {unlistedTasks.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-ink-800 p-4">
              <p className="mb-3 text-sm font-semibold text-ink-100">No list</p>
              <div className="space-y-2">
                {unlistedTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => setOpenTaskId(t.id)} />
                ))}
              </div>
            </div>
          )}

          {listsHere.length === 0 && unlistedTasks.length === 0 && (
            <EmptyState icon={List} title="No lists yet" description="Create a list to start organizing this project's tasks." />
          )}

          <NewTaskListInline folderId={folder.id} />
        </div>
      )}

      <FolderFormModal open={renaming} onClose={() => setRenaming(false)} folder={folder} />
      <FolderFormModal
        open={addingWorkstream}
        onClose={() => setAddingWorkstream(false)}
        ownerId={folder.owner_id}
        parentFolderId={folder.id}
      />
      <TaskFormModal open={creatingTask} onClose={() => setCreatingTask(false)} defaultFolderId={folder.id} />
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        title="Delete this project?"
        description={`"${folder.name}" and everything inside it — workstreams, task lists, and tasks — will be permanently deleted.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
