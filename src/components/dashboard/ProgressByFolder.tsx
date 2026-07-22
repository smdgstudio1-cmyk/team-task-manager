import { useNavigate } from 'react-router-dom'
import type { Folder, Task } from '@/lib/types'
import { ProgressBar } from '@/components/ui/ProgressBar'
import { Card } from '@/components/ui/Card'
import { getFolderStats } from '@/lib/folderStats'

export function ProgressByFolder({ rootFolders, allFolders, tasks }: { rootFolders: Folder[]; allFolders: Folder[]; tasks: Task[] }) {
  const navigate = useNavigate()

  const rows = rootFolders
    .map((f) => ({ folder: f, stats: getFolderStats(f.id, allFolders, tasks) }))
    .filter((r) => r.stats.total > 0)
    .sort((a, b) => a.stats.progress - b.stats.progress)

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-ink-800">Progress by project</h3>
      <div className="space-y-4">
        {rows.map(({ folder, stats }) => (
          <div key={folder.id}>
            <div className="mb-1.5 flex items-center justify-between gap-3">
              <button onClick={() => navigate(`/folders/${folder.id}`)} className="truncate text-sm font-medium text-ink-800">
                {folder.name}
              </button>
              <div className="flex shrink-0 items-center gap-2 text-xs text-ink-500">
                <span>{stats.active} active</span>
                {stats.overdue > 0 && <span className="font-semibold text-red-600">{stats.overdue} overdue</span>}
                <span className="font-semibold text-ink-800">{stats.progress}%</span>
              </div>
            </div>
            <ProgressBar value={stats.progress} size="sm" colorClassName={stats.progress < 40 ? 'bg-amber-400' : 'bg-brand-500'} />
          </div>
        ))}
        {rows.length === 0 && <p className="text-sm text-ink-400">No projects with tasks yet.</p>}
      </div>
    </Card>
  )
}
