import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, FolderKanban, Pencil, Plus, Trash2, CalendarClock, Users } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { getChildFolders, getFolderPath, getFolderStats, getTasksForFolderTree } from '@/lib/folderStats'
import { Card } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { FolderFormModal } from '@/components/folders/FolderFormModal'
import { TaskListSection, NewTaskListInline } from '@/components/folders/TaskListSection'
import { TaskExplorer } from '@/components/tasks/TaskExplorer'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { formatRelative } from '@/lib/utils'
import { toast } from '@/store/toastStore'

export function FolderPage() {
  const { folderId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const folders = useDataStore((s) => s.folders)
  const taskLists = useDataStore((s) => s.taskLists)
  const tasks = useDataStore((s) => s.tasks)
  const teamMembers = useDataStore((s) => s.teamMembers)
  const deleteFolder = useDataStore((s) => s.deleteFolder)

  const [renaming, setRenaming] = useState(false)
  const [addingSubfolder, setAddingSubfolder] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  const folder = folders.find((f) => f.id === folderId)

  if (!folder) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Folder not found"
        description="It may have been deleted, or the link is out of date."
        action={
          <Button size="sm" variant="secondary" onClick={() => navigate('/folders')}>
            Back to Projects
          </Button>
        }
      />
    )
  }

  const owner = teamMembers.find((p) => p.id === folder.owner_id)
  const path = getFolderPath(folder.id, folders)
  const stats = getFolderStats(folder.id, folders, tasks)
  const subfolders = getChildFolders(folder.id, folders)
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
    navigate(folder!.parent_folder_id ? `/folders/${folder!.parent_folder_id}` : '/folders')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-1 text-sm text-ink-400">
        <button onClick={() => navigate('/folders')} className="hover:text-ink-700">
          Projects
        </button>
        {path.map((f, i) => (
          <span key={f.id} className="flex items-center gap-1">
            <ChevronRight size={13} />
            {i === path.length - 1 ? (
              <span className="font-medium text-ink-700">{f.name}</span>
            ) : (
              <button onClick={() => navigate(`/folders/${f.id}`)} className="hover:text-ink-700">
                {f.name}
              </button>
            )}
          </span>
        ))}
      </div>

      <Card>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-semibold text-ink-900">{folder.name}</h1>
            {folder.description && <p className="mt-1 text-sm text-ink-500">{folder.description}</p>}
            <div className="mt-3 flex items-center gap-2">
              {owner ? (
                <>
                  <Avatar name={owner.name} size="sm" />
                  <span className="text-xs text-ink-500">{owner.name}'s workspace</span>
                </>
              ) : (
                <span className="flex items-center gap-1.5 text-xs text-ink-400">
                  <Users size={13} />
                  General project — no single owner
                </span>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1.5">
            <Button size="sm" onClick={() => setCreatingTask(true)}>
              <Plus size={14} />
              Task
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setAddingSubfolder(true)}>
              <Plus size={14} />
              Subfolder
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setRenaming(true)} aria-label="Rename folder">
              <Pencil size={14} />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setConfirmingDelete(true)}
              className="text-red-600 hover:bg-red-50"
              aria-label="Delete folder"
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-5">
          <div>
            <p className="text-xs font-medium text-ink-400">Overall progress</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{stats.progress}%</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Active tasks</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{stats.active}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Completed</p>
            <p className="mt-1 text-lg font-semibold text-ink-900">{stats.completed}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Overdue</p>
            <p className={`mt-1 text-lg font-semibold ${stats.overdue > 0 ? 'text-red-600' : 'text-ink-900'}`}>{stats.overdue}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-ink-400">Next deadline</p>
            <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-ink-900">
              <CalendarClock size={14} className="text-ink-400" />
              {nextDeadline ? formatRelative(nextDeadline.deadline) : '—'}
            </p>
          </div>
        </div>
        <ProgressBar value={stats.progress} className="mt-4" />
      </Card>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-ink-800">Subfolders</h2>
        {subfolders.length > 0 ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subfolders.map((sf) => {
              const sfStats = getFolderStats(sf.id, folders, tasks)
              return (
                <button key={sf.id} onClick={() => navigate(`/folders/${sf.id}`)} className="text-left">
                  <Card className="transition-all hover:-translate-y-px hover:shadow-soft-lg">
                    <div className="flex items-center gap-2">
                      <FolderKanban size={16} className="text-brand-500" />
                      <p className="truncate text-sm font-semibold text-ink-900">{sf.name}</p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-ink-500">
                      <span>{sfStats.active} active</span>
                      <span className="font-semibold text-ink-800">{sfStats.progress}%</span>
                    </div>
                    <ProgressBar value={sfStats.progress} size="sm" className="mt-1.5" />
                  </Card>
                </button>
              )
            })}
          </div>
        ) : (
          <button
            onClick={() => setAddingSubfolder(true)}
            className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-ink-300 px-4 py-3 text-sm font-medium text-ink-500 hover:border-brand-400 hover:text-brand-600"
          >
            <Plus size={16} />
            Add a subfolder to break this project into workstreams
          </button>
        )}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-800">Task lists</h2>
        {listsHere.map((list) => (
          <TaskListSection key={list.id} list={list} tasks={directTasks.filter((t) => t.task_list_id === list.id)} canManage />
        ))}

        {unlistedTasks.length > 0 && (
          <div className="rounded-2xl border border-ink-200/70 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-ink-800">No list</p>
            <div className="space-y-2">
              {unlistedTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => setOpenTaskId(t.id)} />
              ))}
            </div>
          </div>
        )}

        <NewTaskListInline folderId={folder.id} />
      </div>

      <div className="space-y-3 pt-2">
        <h2 className="text-sm font-semibold text-ink-800">
          All tasks in {folder.name}
          {subfolders.length > 0 && ' (including subfolders)'}
        </h2>
        <TaskExplorer
          tasks={allDescendantTasks}
          showFolderFilter={false}
          defaultFolderId={folder.id}
          initialOpenTaskId={searchParams.get('task')}
        />
      </div>

      <FolderFormModal open={renaming} onClose={() => setRenaming(false)} folder={folder} />
      <FolderFormModal
        open={addingSubfolder}
        onClose={() => setAddingSubfolder(false)}
        ownerId={folder.owner_id}
        parentFolderId={folder.id}
      />
      <TaskFormModal open={creatingTask} onClose={() => setCreatingTask(false)} defaultFolderId={folder.id} />
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        title="Delete this folder?"
        description={`"${folder.name}" and everything inside it — subfolders, task lists, and tasks — will be permanently deleted.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </div>
  )
}
