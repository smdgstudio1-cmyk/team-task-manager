import { Search, X } from 'lucide-react'
import type { TaskFilterState } from '@/lib/taskFilters'
import { hasActiveFilters, DEFAULT_FILTERS } from '@/lib/taskFilters'
import { TASK_PRIORITIES, TASK_STATUSES, type TeamMember, type Folder } from '@/lib/types'
import { Select, Input } from '@/components/ui/Field'

export function TaskFiltersBar({
  filters,
  onChange,
  profiles,
  folders,
  showAssignee = true,
  showFolder = true,
}: {
  filters: TaskFilterState
  onChange: (f: TaskFilterState) => void
  profiles?: TeamMember[]
  folders?: Folder[]
  showAssignee?: boolean
  showFolder?: boolean
}) {
  function set<K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) {
    onChange({ ...filters, [key]: value })
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative min-w-[180px] flex-1">
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <Input
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Filter by title..."
          className="pl-9"
        />
      </div>

      {showAssignee && profiles && (
        <Select value={filters.assignedUserId} onChange={(e) => set('assignedUserId', e.target.value)} className="w-auto">
          <option value="all">All members</option>
          {profiles.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      )}

      {showFolder && folders && (
        <Select value={filters.folderId} onChange={(e) => set('folderId', e.target.value)} className="w-auto">
          <option value="all">All folders</option>
          {folders.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </Select>
      )}

      <Select value={filters.status} onChange={(e) => set('status', e.target.value as TaskFilterState['status'])} className="w-auto">
        <option value="all">All statuses</option>
        {TASK_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </Select>

      <Select value={filters.priority} onChange={(e) => set('priority', e.target.value as TaskFilterState['priority'])} className="w-auto">
        <option value="all">All priorities</option>
        {TASK_PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </Select>

      <Select value={filters.overdue} onChange={(e) => set('overdue', e.target.value as TaskFilterState['overdue'])} className="w-auto">
        <option value="all">Any deadline</option>
        <option value="overdue">Overdue</option>
        <option value="on_time">On time</option>
      </Select>

      {hasActiveFilters(filters) && (
        <button
          onClick={() => onChange(DEFAULT_FILTERS)}
          className="flex items-center gap-1 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-400 hover:bg-white/8"
        >
          <X size={14} />
          Clear
        </button>
      )}
    </div>
  )
}
