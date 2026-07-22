import { useState } from 'react'
import { Calendar, Edit2, Trash2, FolderKanban } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { StatusBadge, PriorityBadge, OverdueBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useDataStore } from '@/store/dataStore'
import type { Task } from '@/lib/types'
import { TASK_STATUSES } from '@/lib/types'
import { formatDate, isOverdue } from '@/lib/utils'
import { getFolderPath } from '@/lib/folderStats'
import { TaskFormModal } from './TaskFormModal'

export function TaskDetailModal({ taskId, onClose }: { taskId: string | null; onClose: () => void }) {
  const [editing, setEditing] = useState(false)
  const tasks = useDataStore((s) => s.tasks)
  const folders = useDataStore((s) => s.folders)
  const profiles = useDataStore((s) => s.profiles)
  const updateTask = useDataStore((s) => s.updateTask)
  const deleteTask = useDataStore((s) => s.deleteTask)

  const task = tasks.find((t) => t.id === taskId)
  if (!task) return null

  const assignee = profiles.find((p) => p.id === task.assigned_user_id)
  const path = getFolderPath(task.folder_id, folders)
  const overdue = isOverdue(task)

  function handleDelete() {
    if (confirm(`Delete "${task!.title}"? This can't be undone.`)) {
      deleteTask(task!.id)
      onClose()
    }
  }

  return (
    <>
      <Modal open={!editing} onClose={onClose} title="Task details" width="lg">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <h3 className="text-lg font-semibold text-ink-900">{task.title}</h3>
            <div className="flex shrink-0 gap-2">
              <button
                onClick={() => setEditing(true)}
                className="rounded-lg p-2 text-ink-500 hover:bg-ink-100"
                aria-label="Edit"
              >
                <Edit2 size={16} />
              </button>
              <button onClick={handleDelete} className="rounded-lg p-2 text-red-500 hover:bg-red-50" aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={task.status} />
            <PriorityBadge priority={task.priority} />
            {overdue && <OverdueBadge />}
          </div>

          {task.description && <p className="text-sm text-ink-600">{task.description}</p>}

          <div className="grid grid-cols-2 gap-4 rounded-xl bg-ink-50 p-4 text-sm">
            <div>
              <p className="text-xs font-medium text-ink-400">Assigned to</p>
              <div className="mt-1 flex items-center gap-2">
                {assignee ? (
                  <>
                    <Avatar name={assignee.name} size="sm" />
                    <span className="text-ink-800">{assignee.name}</span>
                  </>
                ) : (
                  <span className="text-ink-400">Unassigned</span>
                )}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Folder</p>
              <p className="mt-1 flex items-center gap-1.5 text-ink-800">
                <FolderKanban size={14} className="text-ink-400" />
                {path.map((f) => f.name).join(' / ') || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Start date</p>
              <p className="mt-1 text-ink-800">{formatDate(task.start_date)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Deadline</p>
              <p className="mt-1 flex items-center gap-1.5 text-ink-800">
                <Calendar size={14} className="text-ink-400" />
                {formatDate(task.deadline)}
              </p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Completed on</p>
              <p className="mt-1 text-ink-800">{formatDate(task.completed_at)}</p>
            </div>
            <div>
              <p className="text-xs font-medium text-ink-400">Last updated</p>
              <p className="mt-1 text-ink-800">{formatDate(task.updated_at)}</p>
            </div>
          </div>

          {task.notes && (
            <div>
              <p className="mb-1 text-xs font-medium text-ink-400">Notes</p>
              <p className="rounded-xl border border-ink-100 bg-white p-3 text-sm text-ink-600">{task.notes}</p>
            </div>
          )}

          <div>
            <p className="mb-1.5 text-xs font-medium text-ink-400">Quick status change</p>
            <Select value={task.status} onChange={(e) => updateTask(task.id, { status: e.target.value as Task['status'] })}>
              {TASK_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <TaskFormModal open={editing} onClose={() => setEditing(false)} task={task} />
    </>
  )
}
