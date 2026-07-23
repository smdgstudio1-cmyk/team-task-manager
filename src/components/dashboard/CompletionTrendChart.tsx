import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from 'recharts'
import { eachDayOfInterval, format, isSameDay, subDays } from 'date-fns'
import type { Task } from '@/lib/types'
import { Card } from '@/components/ui/Card'

export function CompletionTrendChart({ tasks }: { tasks: Task[] }) {
  const today = new Date()
  const start = subDays(today, 13)
  const days = eachDayOfInterval({ start, end: today })

  const data = days.map((day) => ({
    date: format(day, 'MMM d'),
    completed: tasks.filter((t) => t.completed_at && isSameDay(new Date(t.completed_at), day)).length,
  }))

  const totalCompleted = data.reduce((sum, d) => sum + d.completed, 0)

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-800">Completion trend</h3>
        <span className="text-xs text-ink-400">Last 14 days</span>
      </div>
      <p className="mb-4 text-xs text-ink-500">{totalCompleted} tasks completed in this window.</p>
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e2ed" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78708f' }} tickLine={false} axisLine={false} interval={2} />
            <YAxis tick={{ fontSize: 11, fill: '#78708f' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip
              cursor={{ fill: 'rgba(124,77,255,0.06)' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e2ed', fontSize: 12 }}
            />
            <Bar dataKey="completed" fill="#7c4dff" radius={[4, 4, 0, 0]} maxBarSize={18} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
