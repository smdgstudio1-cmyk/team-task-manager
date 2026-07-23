import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, FolderKanban, ListChecks, Plus, ExternalLink } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { getFolderStats } from '@/lib/folderStats'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Button } from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/EmptyState'
import { TaskListSection, NewTaskListInline } from './TaskListSection'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { cx } from '@/lib/utils'
import type { Folder } from '@/lib/types'

export function ProjectSection({ folder }: { folder: Folder }) {
  const navigate = useNavigate()
  const folders = useDataStore((s) => s.folders)
  const taskLists = useDataStore((s) => s.taskLists)
  const tasks = useDataStore((s) => s.tasks)
  const [expanded, setExpanded] = useState(true)
  const [creatingTask, setCreatingTask] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const stats = getFolderStats(folder.id, folders, tasks)
  const listsHere = taskLists.filter((tl) => tl.folder_id === folder.id)
  const directTasks = tasks.filter((t) => t.folder_id === folder.id && !t.archived)
  const unlistedTasks = directTasks.filter((t) => !t.task_list_id)
  const isEmpty = listsHere.length === 0 && unlistedTasks.length === 0

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-800 shadow-soft">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4">
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 text-ink-400 hover:text-ink-100"
          aria-label={expanded ? 'Collapse project' : 'Expand project'}
        >
          {expanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <FolderKanban size={16} className="shrink-0 text-brand-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-ink-50">{folder.name}</p>
          <p className="text-xs text-ink-400">
            {stats.active} active · {stats.progress}% complete
            {stats.overdue > 0 && <span className="text-red-400"> · {stats.overdue} overdue</span>}
          </p>
        </div>
        <div className="hidden w-28 shrink-0 sm:block">
          <ProgressBar value={stats.progress} size="sm" />
        </div>
        <Button size="sm" variant="secondary" onClick={() => setCreatingTask(true)}>
          <Plus size={14} />
          Task
        </Button>
        <button
          onClick={() => navigate(`/projects/${folder.id}`)}
          className="shrink-0 rounded-lg p-2 text-ink-400 hover:bg-white/8 hover:text-ink-100"
          title="Open full project"
          aria-label="Open full project"
        >
          <ExternalLink size={15} />
        </button>
      </div>

      {expanded && (
        <div className={cx('space-y-3 border-t border-white/8 px-5 py-4', isEmpty && 'pt-4')}>
          {listsHere.map((list) => (
            <TaskListSection key={list.id} list={list} tasks={directTasks.filter((t) => t.task_list_id === list.id)} canManage />
          ))}

          {unlistedTasks.length > 0 && (
            <div className="rounded-2xl border border-white/8 bg-white/5 p-4">
              <p className="mb-3 text-sm font-semibold text-ink-100">No list</p>
              <div className="space-y-2">
                {unlistedTasks.map((t) => (
                  <TaskCard key={t.id} task={t} onClick={() => setOpenTaskId(t.id)} />
                ))}
              </div>
            </div>
          )}

          {isEmpty && (
            <EmptyState icon={ListChecks} title="No lists yet" description="Create a list to start organizing this project's tasks." />
          )}

          <NewTaskListInline folderId={folder.id} />
        </div>
      )}

      <TaskFormModal open={creatingTask} onClose={() => setCreatingTask(false)} defaultFolderId={folder.id} />
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  )
}
