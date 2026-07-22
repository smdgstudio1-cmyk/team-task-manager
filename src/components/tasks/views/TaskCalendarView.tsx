import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Task } from '@/lib/types'
import { cx, PRIORITY_COLORS } from '@/lib/utils'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

export function TaskCalendarView({ tasks, onOpenTask }: { tasks: Task[]; onOpenTask: (id: string) => void }) {
  const [cursor, setCursor] = useState(() => new Date())

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstOfMonth = new Date(year, month, 1)
  const startOffset = firstOfMonth.getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const today = new Date()

  return (
    <div className="rounded-2xl border border-ink-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink-900">
          {cursor.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </p>
        <div className="flex gap-1">
          <button
            onClick={() => setCursor(new Date(year, month - 1, 1))}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
          >
            <ChevronLeft size={16} />
          </button>
          <button onClick={() => setCursor(new Date())} className="rounded-lg px-2 text-xs font-medium text-ink-500 hover:bg-ink-100">
            Today
          </button>
          <button
            onClick={() => setCursor(new Date(year, month + 1, 1))}
            className="rounded-lg p-1.5 text-ink-500 hover:bg-ink-100"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-400">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          const dayTasks = date ? tasks.filter((t) => t.deadline && sameDay(new Date(t.deadline), date)) : []
          const isToday = date && sameDay(date, today)
          return (
            <div
              key={i}
              className={cx(
                'min-h-[84px] rounded-lg border border-ink-100 p-1.5 text-left align-top',
                !date && 'border-transparent',
                isToday && 'border-brand-300 bg-brand-50/40'
              )}
            >
              {date && (
                <>
                  <p className={cx('mb-1 text-xs font-medium', isToday ? 'text-brand-700' : 'text-ink-400')}>
                    {date.getDate()}
                  </p>
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => onOpenTask(t.id)}
                        className={cx(
                          'block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium',
                          PRIORITY_COLORS[t.priority].bg,
                          PRIORITY_COLORS[t.priority].text
                        )}
                        title={t.title}
                      >
                        {t.title}
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <p className="px-1.5 text-[11px] text-ink-400">+{dayTasks.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
