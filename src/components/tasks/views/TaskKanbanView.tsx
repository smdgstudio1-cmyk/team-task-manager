import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, useDroppable } from '@dnd-kit/core'
import { useDraggable } from '@dnd-kit/core'
import type { Task, TaskStatus } from '@/lib/types'
import { TASK_STATUSES } from '@/lib/types'
import { STATUS_COLORS, cx, formatRelative, isOverdue } from '@/lib/utils'
import { StatusBadge, PriorityBadge, OverdueBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { useDataStore } from '@/store/dataStore'
import { toast } from '@/store/toastStore'

function KanbanCard({ task, onClick }: { task: Task; onClick: () => void }) {
  const teamMembers = useDataStore((s) => s.teamMembers)
  const assignee = teamMembers.find((p) => p.id === task.assigned_user_id)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const overdue = isOverdue(task)

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 20 }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={onClick}
      className={cx(
        'cursor-grab rounded-xl border border-ink-200 bg-white p-3 shadow-sm active:cursor-grabbing',
        isDragging && 'opacity-50'
      )}
    >
      <p className="text-sm font-medium text-ink-900">{task.title}</p>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityBadge priority={task.priority} />
        {overdue && <OverdueBadge />}
      </div>
      <div className="mt-2 flex items-center justify-between">
        <span className="text-xs text-ink-400">{task.deadline ? formatRelative(task.deadline) : 'No deadline'}</span>
        {assignee && <Avatar name={assignee.name} size="sm" />}
      </div>
    </div>
  )
}

function KanbanColumn({
  status,
  tasks,
  onOpenTask,
}: {
  status: TaskStatus
  tasks: Task[]
  onOpenTask: (id: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status })
  const c = STATUS_COLORS[status]

  return (
    <div
      ref={setNodeRef}
      className={cx(
        'flex w-72 shrink-0 flex-col rounded-2xl bg-ink-50 p-3 transition-colors',
        isOver && 'bg-brand-50 ring-2 ring-brand-200'
      )}
    >
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className={cx('h-2 w-2 rounded-full', c.dot)} />
        <p className="text-sm font-semibold text-ink-800">{status}</p>
        <span className="ml-auto rounded-full bg-white px-2 py-0.5 text-xs font-medium text-ink-500">{tasks.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto">
        {tasks.map((t) => (
          <KanbanCard key={t.id} task={t} onClick={() => onOpenTask(t.id)} />
        ))}
        {tasks.length === 0 && <p className="px-1 py-6 text-center text-xs text-ink-300">Drop tasks here</p>}
      </div>
    </div>
  )
}

export function TaskKanbanView({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  const updateTask = useDataStore((s) => s.updateTask)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const newStatus = over.id as TaskStatus
    const task = tasks.find((t) => t.id === active.id)
    if (task && task.status !== newStatus) {
      updateTask(task.id, { status: newStatus })
      toast.success(`Moved to "${newStatus}"`)
    }
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-2">
        {TASK_STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tasks={tasks.filter((t) => t.status === status)}
            onOpenTask={onOpenTask}
          />
        ))}
      </div>
    </DndContext>
  )
}
