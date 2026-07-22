import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import type { Task } from '@/lib/types'
import { TASK_STATUSES } from '@/lib/types'
import { STATUS_COLORS } from '@/lib/utils'
import { Card } from '@/components/ui/Card'

const HEX: Record<string, string> = {
  'Not Started': '#9c9cb3',
  'In Progress': '#3b82f6',
  'Waiting / Blocked': '#f59e0b',
  'In Review': '#a855f7',
  Completed: '#10b981',
}

export function StatusChart({ tasks }: { tasks: Task[] }) {
  const data = TASK_STATUSES.map((status) => ({
    name: status,
    value: tasks.filter((t) => t.status === status).length,
  })).filter((d) => d.value > 0)

  return (
    <Card>
      <h3 className="mb-4 text-sm font-semibold text-ink-800">Tasks by status</h3>
      {data.length === 0 ? (
        <p className="text-sm text-ink-400">No tasks yet.</p>
      ) : (
        <div className="flex items-center gap-4">
          <div className="h-40 w-40 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {data.map((d) => (
                    <Cell key={d.name} fill={HEX[d.name]} stroke="none" />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex-1 space-y-2">
            {data.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-ink-600">
                  <span
                    className={`h-2 w-2 rounded-full ${STATUS_COLORS[d.name as keyof typeof STATUS_COLORS].dot}`}
                  />
                  {d.name}
                </span>
                <span className="font-semibold text-ink-900">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
