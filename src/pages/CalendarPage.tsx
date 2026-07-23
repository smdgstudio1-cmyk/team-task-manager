import { useMemo, useState } from 'react'
import { useDataStore } from '@/store/dataStore'
import { TaskCalendarView } from '@/components/tasks/views/TaskCalendarView'
import { TaskDetailModal } from '@/components/tasks/TaskDetailModal'
import { TaskFiltersBar } from '@/components/tasks/TaskFiltersBar'
import { DEFAULT_FILTERS, filterTasks, type TaskFilterState } from '@/lib/taskFilters'

export function CalendarPage() {
  const tasks = useDataStore((s) => s.tasks)
  const teamMembers = useDataStore((s) => s.teamMembers)
  const folders = useDataStore((s) => s.folders)
  const [filters, setFilters] = useState<TaskFilterState>(DEFAULT_FILTERS)
  const [openTaskId, setOpenTaskId] = useState<string | null>(null)

  const filtered = useMemo(() => filterTasks(tasks.filter((t) => !t.archived), filters), [tasks, filters])

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">Calendar</h1>
        <p className="mt-1 text-sm text-ink-500">Every deadline across the studio, laid out by day.</p>
      </div>

      <TaskFiltersBar filters={filters} onChange={setFilters} profiles={teamMembers} folders={folders} />

      <TaskCalendarView tasks={filtered} onOpenTask={setOpenTaskId} />

      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  )
}
