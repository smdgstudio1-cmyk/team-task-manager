import { useState } from 'react'
import { ChevronDown, ChevronRight, ListPlus, Pencil, Plus, Trash2 } from 'lucide-react'
import type { Task, TaskList } from '@/lib/types'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskFormModal } from '@/components/tasks/TaskFormModal'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { useDataStore } from '@/store/dataStore'
import { Input } from '@/components/ui/Field'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { toast } from '@/store/toastStore'

export function TaskListSection({
  list,
  tasks,
  canManage,
}: {
  list: TaskList
  tasks: Task[]
  canManage: boolean
}) {
  const [expanded, setExpanded] = useState(true)
  const [renaming, setRenaming] = useState(false)
  const [name, setName] = useState(list.name)
  const [creating, setCreating] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const updateTaskList = useDataStore((s) => s.updateTaskList)
  const deleteTaskList = useDataStore((s) => s.deleteTaskList)

  async function handleDelete() {
    await deleteTaskList(list.id)
    toast.success(`List "${list.name}" deleted`)
    setConfirmingDelete(false)
  }

  async function handleRename() {
    if (name.trim() && name.trim() !== list.name) {
      await updateTaskList(list.id, { name: name.trim() })
    }
    setRenaming(false)
  }

  return (
    <div className="rounded-2xl border border-white/8 bg-ink-800">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setExpanded((e) => !e)} className="text-ink-400">
          {expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        {renaming ? (
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
            className="max-w-xs"
          />
        ) : (
          <p className="text-sm font-semibold text-ink-100">{list.name}</p>
        )}
        <span className="rounded-full bg-white/8 px-2 py-0.5 text-xs font-medium text-ink-400">{tasks.length}</span>
        <div className="ml-auto flex items-center gap-1">
          {canManage && (
            <>
              <button onClick={() => setCreating(true)} className="rounded p-1.5 text-ink-400 hover:bg-white/8 hover:text-ink-100" title="Add task">
                <Plus size={14} />
              </button>
              <button onClick={() => setRenaming(true)} className="rounded p-1.5 text-ink-400 hover:bg-white/8 hover:text-ink-100" title="Rename list">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => setConfirmingDelete(true)}
                className="rounded p-1.5 text-ink-400 hover:bg-red-500/15 hover:text-red-400"
                title="Delete list"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      </div>
      {expanded && (
        <div className="space-y-2 border-t border-white/8 p-3">
          {tasks.length === 0 && <p className="px-2 py-2 text-sm text-ink-500">No tasks in this list yet.</p>}
          {tasks.map((t) => (
            <TaskCard key={t.id} task={t} onClick={() => setOpenTaskId(t.id)} />
          ))}
        </div>
      )}

      <TaskFormModal open={creating} onClose={() => setCreating(false)} defaultFolderId={list.folder_id} defaultTaskListId={list.id} />
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />

      <ConfirmDialog
        open={confirmingDelete}
        onClose={() => setConfirmingDelete(false)}
        onConfirm={handleDelete}
        title="Delete this task list?"
        description={`Tasks inside "${list.name}" will move to "No list" rather than being deleted.`}
        confirmLabel="Delete list"
        variant="danger"
      />
    </div>
  )
}

export function NewTaskListInline({ folderId }: { folderId: string }) {
  const [adding, setAdding] = useState(false)
  const [name, setName] = useState('')
  const createTaskList = useDataStore((s) => s.createTaskList)

  async function submit() {
    if (name.trim()) {
      await createTaskList({ name: name.trim(), folder_id: folderId })
    }
    setName('')
    setAdding(false)
  }

  if (!adding) {
    return (
      <button
        onClick={() => setAdding(true)}
        className="flex items-center gap-2 rounded-2xl border border-dashed border-white/15 px-4 py-3 text-sm font-medium text-ink-400 hover:border-brand-400 hover:text-brand-400"
      >
        <ListPlus size={16} />
        New task list
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-ink-800 px-4 py-3">
      <Input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onBlur={submit}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        placeholder="List name..."
      />
    </div>
  )
}
