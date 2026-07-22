import { useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { ChevronRight, FolderKanban, Pencil, Plus, Trash2 } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
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

export function FolderPage() {
  const { folderId } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const profile = useAuthStore((s) => s.profile)
  const folders = useDataStore((s) => s.folders)
  const taskLists = useDataStore((s) => s.taskLists)
  const tasks = useDataStore((s) => s.tasks)
  const profiles = useDataStore((s) => s.profiles)
  const deleteFolder = useDataStore((s) => s.deleteFolder)

  const [renaming, setRenaming] = useState(false)
  const [addingSubfolder, setAddingSubfolder] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const folder = folders.find((f) => f.id === folderId)

  if (!profile) return null

  if (!folder) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Folder not found"
        description="It may have been deleted, or you don't have access to it."
        action={
          <Button size="sm" variant="secondary" onClick={() => navigate('/folders')}>
            Back to Projects
          </Button>
        }
      />
    )
  }

  const canManage = folder.owner_id === profile.id || profile.role === 'admin'
  const owner = profiles.find((p) => p.id === folder.owner_id)
  const path = getFolderPath(folder.id, folders)
  const stats = getFolderStats(folder.id, folders, tasks)
  const subfolders = getChildFolders(folder.id, folders)
  const listsHere = taskLists.filter((tl) => tl.folder_id === folder.id)
  const directTasks = tasks.filter((t) => t.folder_id === folder.id)
  const unlistedTasks = directTasks.filter((t) => !t.task_list_id)
  const allDescendantTasks = getTasksForFolderTree(folder.id, folders, tasks)

  function handleDelete() {
    if (confirm(`Delete "${folder!.name}" and everything inside it? This can't be undone.`)) {
      deleteFolder(folder!.id)
      navigate(folder!.parent_folder_id ? `/folders/${folder!.parent_folder_id}` : '/folders')
    }
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
            {owner && (
              <div className="mt-3 flex items-center gap-2">
                <Avatar name={owner.name} size="sm" />
                <span className="text-xs text-ink-500">{owner.name}'s workspace</span>
              </div>
            )}
          </div>
          {canManage && (
            <div className="flex shrink-0 gap-1.5">
              <Button size="sm" variant="secondary" onClick={() => setAddingSubfolder(true)}>
                <Plus size={14} />
                Subfolder
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setRenaming(true)}>
                <Pencil size={14} />
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDelete} className="text-red-600 hover:bg-red-50">
                <Trash2 size={14} />
              </Button>
            </div>
          )}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-4">
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
        </div>
        <ProgressBar value={stats.progress} className="mt-4" />
      </Card>

      {subfolders.length > 0 && (
        <div>
          <h2 className="mb-2 text-sm font-semibold text-ink-800">Subfolders</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {subfolders.map((sf) => {
              const sfStats = getFolderStats(sf.id, folders, tasks)
              return (
                <button key={sf.id} onClick={() => navigate(`/folders/${sf.id}`)} className="text-left">
                  <Card className="transition-shadow hover:shadow-md">
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
        </div>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-ink-800">Task lists</h2>
        {listsHere.map((list) => (
          <TaskListSection key={list.id} list={list} tasks={directTasks.filter((t) => t.task_list_id === list.id)} canManage={canManage} />
        ))}

        {unlistedTasks.length > 0 && (
          <div className="rounded-2xl border border-ink-200 bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-ink-800">No list</p>
            <div className="space-y-2">
              {unlistedTasks.map((t) => (
                <TaskCard key={t.id} task={t} onClick={() => setOpenTaskId(t.id)} />
              ))}
            </div>
          </div>
        )}

        {canManage && <NewTaskListInline folderId={folder.id} />}
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
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  )
}
