import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, ChevronRight, FolderKanban, ListChecks, Plus, ExternalLink } from 'lucide-react'
import { useDataStore } from '@/store/dataStore'
import { getFolderStats } from '@/lib/folderStats'
import { ProgressBar } from '@/components/ui/ProgressBar'
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
    <div className="flex max-h-[30rem] flex-col overflow-hidden rounded-2xl border border-white/8 bg-ink-800 shadow-soft">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <div className="flex items-start gap-2">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-0.5 shrink-0 text-ink-400 hover:text-ink-100"
            aria-label={expanded ? 'Collapse project' : 'Expand project'}
          >
            {expanded ? <ChevronDown size={17} /> : <ChevronRight size={17} />}
          </button>
          <FolderKanban size={15} className="mt-0.5 shrink-0 text-brand-400" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-ink-50">{folder.name}</p>
            <p className="truncate text-xs text-ink-400">
              {stats.active} active · {stats.progress}%{stats.overdue > 0 && <span className="text-red-400"> · {stats.overdue} overdue</span>}
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-0.5">
            <button
              onClick={() => setCreatingTask(true)}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-white/8 hover:text-ink-100"
              title="Add task"
              aria-label="Add task"
            >
              <Plus size={15} />
            </button>
            <button
              onClick={() => navigate(`/projects/${folder.id}`)}
              className="rounded-lg p-1.5 text-ink-400 hover:bg-white/8 hover:text-ink-100"
              title="Open full project"
              aria-label="Open full project"
            >
              <ExternalLink size={14} />
            </button>
          </div>
        </div>
        <ProgressBar value={stats.progress} size="sm" className="mt-2.5" />
      </div>

      {expanded && (
        <>
          <div className={cx('min-h-0 flex-1 space-y-3 overflow-y-auto border-t border-white/8 px-4 py-3', isEmpty && 'flex items-center')}>
            {listsHere.map((list) => (
              <TaskListSection key={list.id} list={list} tasks={directTasks.filter((t) => t.task_list_id === list.id)} canManage />
            ))}

            {unlistedTasks.length > 0 && (
              <div className="rounded-2xl border border-white/8 bg-white/5 p-3">
                <p className="mb-2 text-xs font-semibold text-ink-100">No list</p>
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
          </div>
          <div className="shrink-0 border-t border-white/8 px-4 py-3">
            <NewTaskListInline folderId={folder.id} />
          </div>
        </>
      )}

      <TaskFormModal open={creatingTask} onClose={() => setCreatingTask(false)} defaultFolderId={folder.id} />
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  )
}
