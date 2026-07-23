import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { eachDayOfInterval, format, isSameDay } from 'date-fns'
import type { Task } from '@/lib/types'
import { Card } from '@/components/ui/Card'

export function UpcomingWorkloadChart({ tasks }: { tasks: Task[] }) {
  const today = new Date()
  const days = eachDayOfInterval({ start: today, end: new Date(today.getTime() + 6 * 24 * 60 * 60 * 1000) })

  const data = days.map((day) => ({
    date: format(day, 'EEE d'),
    due: tasks.filter((t) => t.status !== 'Completed' && t.deadline && isSameDay(new Date(t.deadline), day)).length,
  }))

  const totalDue = data.reduce((sum, d) => sum + d.due, 0)

  return (
    <Card>
      <div className="mb-1 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink-800">Upcoming workload</h3>
        <span className="text-xs text-ink-400">Next 7 days</span>
      </div>
      <p className="mb-4 text-xs text-ink-500">{totalDue} tasks coming due.</p>
      <div className="h-40">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid vertical={false} stroke="#e5e2ed" />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#78708f' }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#78708f' }} tickLine={false} axisLine={false} allowDecimals={false} width={28} />
            <Tooltip
              cursor={{ fill: 'rgba(250,106,30,0.06)' }}
              contentStyle={{ borderRadius: 12, border: '1px solid #e5e2ed', fontSize: 12 }}
            />
            <Bar dataKey="due" fill="#fa6a1e" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  )
}
