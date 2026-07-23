import { useEffect, useState } from 'react'
import { Calendar, Edit2, Trash2, FolderKanban, Check, Copy, Archive, ArchiveRestore } from 'lucide-react'
import { Drawer } from '@/components/ui/Drawer'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { StatusBadge, PriorityBadge, OverdueBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useDataStore } from '@/store/dataStore'
import type { Task } from '@/lib/types'
import { TASK_STATUSES } from '@/lib/types'
import { cx, formatDate, isOverdue } from '@/lib/utils'
import { getFolderPath } from '@/lib/folderStats'
import { toast } from '@/store/toastStore'
import { TaskFormModal } from './TaskFormModal'
import { NotesSection } from './NotesSection'
import { AttachmentsSection } from './AttachmentsSection'
import { ActivityTimeline } from './ActivityTimeline'

type Tab = 'details' | 'notes' | 'attachments' | 'activity'

export function TaskDetailModal({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const [editing, setEditing] = useState(false)
  const [tab, setTab] = useState<Tab>('details')
  const [pendingDelete, setPendingDelete] = useState(false)
  const tasks = useDataStore((s) => s.tasks)
  const folders = useDataStore((s) => s.folders)
  const teamMembers = useDataStore((s) => s.teamMembers)
  const updateTask = useDataStore((s) => s.updateTask)
  const deleteTask = useDataStore((s) => s.deleteTask)
  const duplicateTask = useDataStore((s) => s.duplicateTask)
  const archiveTask = useDataStore((s) => s.archiveTask)
  const loadTaskExtras = useDataStore((s) => s.loadTaskExtras)
  const notesCount = useDataStore((s) => (taskId ? (s.notesByTask[taskId] || []).length : 0))
  const attachmentsCount = useDataStore((s) => (taskId ? (s.attachmentsByTask[taskId] || []).length : 0))
  const activityCount = useDataStore((s) => (taskId ? (s.activityByTask[taskId] || []).length : 0))

  useEffect(() => {
    if (taskId) {
      loadTaskExtras(taskId)
      setTab('details')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId])

  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null

  const assignee = teamMembers.find((p) => p.id === task.assigned_user_id)
  const path = getFolderPath(task.folder_id, folders)
  const overdue = isOverdue(task)
  const completed = task.status === 'Completed'

  async function handleDelete() {
    await deleteTask(task!.id)
    toast.success('Task deleted')
    setPendingDelete(false)
    onClose()
  }

  async function handleDuplicate() {
    const copy = await duplicateTask(task!.id)
    if (copy) toast.success('Task duplicated')
  }

  async function handleArchiveToggle() {
    await archiveTask(task!.id, !task!.archived)
    toast.success(task!.archived ? 'Task restored' : 'Task archived')
    onClose()
  }

  function toggleComplete() {
    updateTask(task!.id, { status: completed ? 'Not Started' : 'Completed' })
  }

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'details', label: 'Details' },
    { key: 'notes', label: 'Notes', count: notesCount },
    { key: 'attachments', label: 'Files', count: attachmentsCount },
    { key: 'activity', label: 'Activity', count: activityCount },
  ]

  return (
    <>
      <Drawer
        open={!editing && !!taskId}
        onClose={onClose}
        title={task.title}
        subtitle={path.map((f) => f.name).join(' / ')}
        footer={
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex gap-1">
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg p-2 text-ink-400 hover:bg-white/8 hover:text-ink-100"
                aria-label="Edit"
                title="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button
                onClick={handleDuplicate}
                className="rounded-lg p-2 text-ink-400 hover:bg-white/8 hover:text-ink-100"
                aria-label="Duplicate"
                title="Duplicate"
              >
                <Copy size={16} />
              </button>
              <button
                onClick={handleArchiveToggle}
                className="rounded-lg p-2 text-ink-400 hover:bg-white/8 hover:text-ink-100"
                aria-label={task.archived ? 'Restore' : 'Archive'}
                title={task.archived ? 'Restore' : 'Archive'}
              >
                {task.archived ? <ArchiveRestore size={16} /> : <Archive size={16} />}
              </button>
              <button
                onClick={() => setPendingDelete(true)}
                className="rounded-lg p-2 text-red-400 hover:bg-red-500/10"
                aria-label="Delete"
                title="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <Button onClick={toggleComplete} variant={completed ? 'secondary' : 'primary'} size="sm">
              <Check size={14} />
              {completed ? 'Mark incomplete' : 'Mark complete'}
            </Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge status={task.status} />
          <PriorityBadge priority={task.priority} />
          {overdue && <OverdueBadge />}
          {task.archived && (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-xs font-medium text-ink-400">
              Archived
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-1 border-b border-white/8">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cx(
                'relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors',
                tab === t.key ? 'text-brand-400' : 'text-ink-400 hover:text-ink-100'
              )}
            >
              {t.label}
              {typeof t.count === 'number' && t.count > 0 && (
                <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[10px] font-semibold text-ink-400">{t.count}</span>
              )}
              {tab === t.key && <span className="absolute -bottom-px left-0 right-0 h-0.5 rounded-full bg-brand-500" />}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {tab === 'details' && (
            <div className="space-y-5">
              {task.description && <p className="text-sm text-ink-300">{task.description}</p>}

              <div className="grid grid-cols-2 gap-4 rounded-xl bg-white/5 p-4 text-sm">
                <div>
                  <p className="text-xs font-medium text-ink-500">Assigned to</p>
                  <div className="mt-1 flex items-center gap-2">
                    {assignee ? (
                      <>
                        <Avatar name={assignee.name} size="sm" />
                        <span className="text-ink-100">{assignee.name}</span>
                      </>
                    ) : (
                      <span className="text-ink-500">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-500">Project</p>
                  <p className="mt-1 flex items-center gap-1.5 text-ink-100">
                    <FolderKanban size={14} className="text-ink-400" />
                    {path.map((f) => f.name).join(' / ') || '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-500">Start date</p>
                  <p className="mt-1 text-ink-100">{formatDate(task.start_date)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-500">Deadline</p>
                  <p className="mt-1 flex items-center gap-1.5 text-ink-100">
                    <Calendar size={14} className="text-ink-400" />
                    {formatDate(task.deadline)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-500">Completed on</p>
                  <p className="mt-1 text-ink-100">{formatDate(task.completed_at)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-ink-500">Last updated</p>
                  <p className="mt-1 text-ink-100">{formatDate(task.updated_at)}</p>
                </div>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-ink-500">Quick status change</p>
                <Select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}>
                  {TASK_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}

          {tab === 'notes' && <NotesSection taskId={task.id} />}
          {tab === 'attachments' && <AttachmentsSection taskId={task.id} />}
          {tab === 'activity' && <ActivityTimeline taskId={task.id} />}
        </div>
      </Drawer>

      <TaskFormModal open={editing} onClose={() => setEditing(false)} task={task} />

      <ConfirmDialog
        open={pendingDelete}
        onClose={() => setPendingDelete(false)}
        onConfirm={handleDelete}
        title="Delete this task?"
        description={`"${task.title}" will be permanently deleted, including its notes and attachments. This can't be undone.`}
        confirmLabel="Delete"
        variant="danger"
      />
    </>
  )
}
