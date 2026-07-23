import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { AlertTriangle } from 'lucide-react'
import type { Folder, Task } from '@/lib/types'
import { Card } from '@/components/ui/Card'
import { isOverdue } from '@/lib/utils'
import { getTasksForFolderTree } from '@/lib/folderStats'

export function OverdueByProjectChart({ rootFolders, allFolders, tasks }: { rootFolders: Folder[]; allFolders: Folder[]; tasks: Task[] }) {
  const data = rootFolders
    .map((f) => ({
      name: f.name.length > 18 ? f.name.slice(0, 16) + '…' : f.name,
      fullName: f.name,
      overdue: getTasksForFolderTree(f.id, allFolders, tasks).filter((t) => isOverdue(t)).length,
    }))
    .filter((d) => d.overdue > 0)
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 8)

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-ink-800">Overdue by project</h3>
      {data.length === 0 ? (
        <div className="flex items-center gap-2 rounded-xl bg-ink-50 px-3 py-4 text-sm text-ink-500">
          <AlertTriangle size={16} className="shrink-0 text-ink-400" />
          No overdue work in any project.
        </div>
      ) : (
        <div style={{ height: Math.max(120, data.length * 32) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid horizontal={false} stroke="#e5e2ed" />
              <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11, fill: '#78708f' }} tickLine={false} axisLine={false} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fontSize: 12, fill: '#423c58' }}
                tickLine={false}
                axisLine={false}
                width={110}
              />
              <Tooltip
                cursor={{ fill: 'rgba(239,68,68,0.05)' }}
                contentStyle={{ borderRadius: 12, border: '1px solid #e5e2ed', fontSize: 12 }}
                formatter={(value) => [`${value} overdue`, '']}
                labelFormatter={(_, payload) => payload?.[0]?.payload?.fullName || ''}
              />
              <Bar dataKey="overdue" fill="#ef4444" radius={[0, 4, 4, 0]} maxBarSize={16} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  )
}
