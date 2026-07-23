import { useNavigate } from 'react-router-dom'
import { FolderKanban } from 'lucide-react'
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

  const fallingBehind = rows.filter((r) => r.stats.progress < 40 || r.stats.overdue > 0).length

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-800">Project health</h3>
        {fallingBehind > 0 && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
            {fallingBehind} need{fallingBehind === 1 ? 's' : ''} attention
          </span>
        )}
      </div>
      <div className="space-y-4">
        {rows.map(({ folder, stats }) => {
          const behind = stats.progress < 40 || stats.overdue > 0
          return (
            <div key={folder.id}>
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <button
                  onClick={() => navigate(`/folders/${folder.id}`)}
                  className="flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-ink-800"
                >
                  <FolderKanban size={13} className="shrink-0 text-ink-400" />
                  <span className="truncate">{folder.name}</span>
                </button>
                <div className="flex shrink-0 items-center gap-2 text-xs text-ink-500">
                  <span>{stats.active} active</span>
                  {stats.overdue > 0 && <span className="font-semibold text-red-600">{stats.overdue} overdue</span>}
                  <span className="w-9 text-right font-semibold text-ink-800">{stats.progress}%</span>
                </div>
              </div>
              <ProgressBar value={stats.progress} size="sm" colorClassName={behind ? 'bg-amber-400' : 'bg-brand-500'} />
            </div>
          )
        })}
        {rows.length === 0 && (
          <div className="flex items-center gap-3 rounded-xl bg-ink-50 px-3 py-4 text-sm text-ink-500">
            <FolderKanban size={16} className="shrink-0 text-ink-400" />
            No projects with tasks yet.
          </div>
        )}
      </div>
    </Card>
  )
}
