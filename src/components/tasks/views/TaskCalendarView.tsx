import { useState } from 'react'
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DndContext, type DragEndEvent, PointerSensor, useDraggable, useDroppable, useSensor, useSensors } from '@dnd-kit/core'
import type { Task } from '@/lib/types'
import { cx, isOverdue } from '@/lib/utils'
import { useDataStore } from '@/store/dataStore'
import { toast } from '@/store/toastStore'
import { UpcomingDeadlinesPanel } from '../UpcomingDeadlinesPanel'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function chipStyle(task: Task): string {
  if (task.status === 'Completed') return 'bg-emerald-50 text-emerald-700 line-through decoration-emerald-400'
  if (isOverdue(task)) return 'bg-red-50 text-red-700'
  if (task.status === 'Waiting / Blocked') return 'bg-amber-50 text-amber-700'
  return 'bg-brand-50 text-brand-700'
}

function DayChip({ task, onOpenTask }: { task: Task; onOpenTask: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id })
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 30 } : undefined

  return (
    <button
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => onOpenTask(task.id)}
      className={cx(
        'block w-full cursor-grab truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium active:cursor-grabbing',
        chipStyle(task),
        isDragging && 'opacity-40'
      )}
      title={task.title}
    >
      {task.title}
    </button>
  )
}

function DayCell({
  date,
  inMonth,
  tasks,
  onOpenTask,
  compact,
}: {
  date: Date
  inMonth: boolean
  tasks: Task[]
  onOpenTask: (id: string) => void
  compact: boolean
}) {
  const key = format(date, 'yyyy-MM-dd')
  const { setNodeRef, isOver } = useDroppable({ id: key })
  const today = isToday(date)
  const visibleLimit = compact ? 3 : 20

  return (
    <div
      ref={setNodeRef}
      className={cx(
        'min-h-[88px] rounded-lg border p-1.5 text-left align-top transition-colors',
        compact ? 'min-h-[88px]' : 'min-h-[160px]',
        inMonth ? 'border-ink-100' : 'border-transparent opacity-40',
        today && 'border-brand-300 bg-brand-50/40',
        isOver && 'bg-brand-50 ring-2 ring-brand-300'
      )}
    >
      <p className={cx('mb-1 text-xs font-medium', today ? 'text-brand-700' : 'text-ink-400')}>{format(date, 'd')}</p>
      <div className="space-y-1">
        {tasks.slice(0, visibleLimit).map((t) => (
          <DayChip key={t.id} task={t} onOpenTask={onOpenTask} />
        ))}
        {tasks.length > visibleLimit && <p className="px-1.5 text-[11px] text-ink-400">+{tasks.length - visibleLimit} more</p>}
      </div>
    </div>
  )
}

export function TaskCalendarView({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  const [mode, setMode] = useState<'month' | 'week'>('month')
  const [cursor, setCursor] = useState(() => new Date())
  const updateTask = useDataStore((s) => s.updateTask)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const rangeStart = mode === 'month' ? startOfWeek(startOfMonth(cursor)) : startOfWeek(cursor)
  const rangeEnd = mode === 'month' ? endOfWeek(endOfMonth(cursor)) : endOfWeek(cursor)
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd })

  function goPrev() {
    setCursor(mode === 'month' ? subMonths(cursor, 1) : subWeeks(cursor, 1))
  }
  function goNext() {
    setCursor(mode === 'month' ? addMonths(cursor, 1) : addWeeks(cursor, 1))
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const task = tasks.find((t) => t.id === active.id)
    if (!task || !task.deadline) return
    const targetDate = new Date(`${over.id}T00:00:00`)
    const original = new Date(task.deadline)
    targetDate.setHours(original.getHours(), original.getMinutes())
    if (isSameDay(original, targetDate)) return
    updateTask(task.id, { deadline: targetDate.toISOString() })
    toast.success(`Rescheduled to ${format(targetDate, 'MMM d')}`)
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_280px]">
      <div className="rounded-2xl border border-ink-200/70 bg-white p-4 shadow-soft">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-semibold text-ink-900">
            {mode === 'month' ? format(cursor, 'MMMM yyyy') : `Week of ${format(rangeStart, 'MMM d')}`}
          </p>
          <div className="flex items-center gap-2">
            <div className="flex rounded-lg bg-ink-100 p-0.5">
              <button
                onClick={() => setMode('month')}
                className={cx(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  mode === 'month' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
                )}
              >
                Month
              </button>
              <button
                onClick={() => setMode('week')}
                className={cx(
                  'rounded-md px-2.5 py-1 text-xs font-medium transition-colors',
                  mode === 'week' ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'
                )}
              >
                Week
              </button>
            </div>
            <div className="flex gap-1">
              <button onClick={goPrev} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
                <ChevronLeft size={16} />
              </button>
              <button onClick={() => setCursor(new Date())} className="rounded-lg px-2 text-xs font-medium text-ink-500 hover:bg-ink-100">
                Today
              </button>
              <button onClick={goNext} className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-400">
          {WEEKDAYS.map((d) => (
            <div key={d} className="py-1">
              {d}
            </div>
          ))}
        </div>

        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-1">
            {days.map((date) => {
              const dayTasks = tasks.filter((t) => t.deadline && isSameDay(new Date(t.deadline), date))
              return (
                <DayCell
                  key={date.toISOString()}
                  date={date}
                  inMonth={mode === 'week' || isSameMonth(date, cursor)}
                  tasks={dayTasks}
                  onOpenTask={onOpenTask}
                  compact={mode === 'month'}
                />
              )
            })}
          </div>
        </DndContext>

        <p className="mt-3 text-xs text-ink-400">Drag a task chip to a new day to reschedule its deadline.</p>
      </div>

      <UpcomingDeadlinesPanel tasks={tasks} onOpenTask={onOpenTask} />
    </div>
  )
}
