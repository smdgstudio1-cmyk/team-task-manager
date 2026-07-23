import { useMemo, useState } from 'react'
import { useDataStore } from '@/store/dataStore'
import { TaskCalendarView } from '@/components/tasks/views/TaskCalendarView'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { Select } from '@/components/ui/Field'

export function CalendarPage() {
  const tasks = useDataStore((s) => s.tasks)
  const teamMembers = useDataStore((s) => s.teamMembers).filter((m) => !m.archived)
  const [memberId, setMemberId] = useState('all')
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const active = tasks.filter((t) => !t.archived)
    return memberId === 'all' ? active : active.filter((t) => t.assigned_user_id === memberId)
  }, [tasks, memberId])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-ink-50">Calendar</h1>
          <p className="mt-1 text-sm text-ink-400">Every deadline across the studio, laid out by day.</p>
        </div>
        <Select value={memberId} onChange={(e) => setMemberId(e.target.value)} className="w-auto">
          <option value="all">All members</option>
          {teamMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </Select>
      </div>

      <TaskCalendarView tasks={filtered} onOpenTask={setOpenTaskId} />

      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  )
}
