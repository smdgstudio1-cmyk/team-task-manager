import { useMemo, useState } from 'react'
import { List, Kanban, Calendar as CalendarIcon, CalendarClock, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { TaskFiltersBar } from './TaskFiltersBar'
import { TaskListView } from './views/TaskListView'
import { TaskKanbanView } from './views/TaskKanbanView'
import { TaskCalendarView } from './views/TaskCalendarView'
import { TaskDeadlineView } from './views/TaskDeadlineView'
import { TaskFormModal } from './TaskFormModal'
import { TaskDetailModal } from './TaskDetailModal'
import { DEFAULT_FILTERS, filterTasks, type TaskFilterState } from '@/lib/taskFilters'
import type { Task } from '@/lib/types'
import { useDataStore } from '@/store/dataStore'
import { cx } from '@/lib/utils'

type ViewMode = 'list' | 'kanban' | 'calendar' | 'deadline'

const VIEW_TABS: { key: ViewMode; label: string; icon: typeof List }[] = [
  { key: 'list', label: 'List', icon: List },
  { key: 'kanban', label: 'Kanban', icon: Kanban },
  { key: 'calendar', label: 'Calendar', icon: CalendarIcon },
  { key: 'deadline', label: 'Deadline', icon: CalendarClock },
]

export function TaskExplorer({
  tasks,
  showAssigneeFilter = true,
  showFolderFilter = true,
  defaultFolderId,
  initialOpenTaskId,
}: {
  tasks: Task[]
  showAssigneeFilter?: boolean
  showFolderFilter?: boolean
  defaultFolderId?: string
  initialOpenTaskId?: string | null
}) {
  const [view, setView] = useState<ViewMode>('list')
  const [filters, setFilters] = useState<TaskFilterState>(DEFAULT_FILTERS)
  const [creating, setCreating] = useState(false)
  const [openTaskId, setOpenTaskId] = useState<string | null>(initialOpenTaskId || null)
  const teamMembers = useDataStore((s) => s.teamMembers)
  const folders = useDataStore((s) => s.folders)

  const filtered = useMemo(() => filterTasks(tasks.filter((t) => !t.archived), filters), [tasks, filters])

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex rounded-xl bg-ink-100 p-1">
          {VIEW_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setView(tab.key)}
              className={cx(
                'flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors',
                view === tab.key ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500 hover:text-ink-700'
              )}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus size={15} />
          New task
        </Button>
      </div>

      <TaskFiltersBar
        filters={filters}
        onChange={setFilters}
        profiles={showAssigneeFilter ? teamMembers : undefined}
        folders={showFolderFilter ? folders : undefined}
        showAssignee={showAssigneeFilter}
        showFolder={showFolderFilter}
      />

      {view === 'list' && <TaskListView tasks={filtered} onOpenTask={setOpenTaskId} />}
      {view === 'kanban' && <TaskKanbanView tasks={filtered} onOpenTask={setOpenTaskId} />}
      {view === 'calendar' && <TaskCalendarView tasks={filtered} onOpenTask={setOpenTaskId} />}
      {view === 'deadline' && <TaskDeadlineView tasks={filtered} onOpenTask={setOpenTaskId} />}

      <TaskFormModal open={creating} onClose={() => setCreating(false)} defaultFolderId={defaultFolderId} />
      <TaskDetailModal taskId={openTaskId} onClose={() => setOpenTaskId(null)} />
    </div>
  )
}
