import type { LucideIcon } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { cx } from '@/lib/utils'

export function StatCard({
  icon: Icon,
  label,
  value,
  tint = 'brand',
}: {
  icon: LucideIcon
  label: string
  value: string | number
  tint?: 'brand' | 'red' | 'amber' | 'emerald' | 'sky'
}) {
  const tintClasses: Record<string, string> = {
    brand: 'bg-brand-50 text-brand-600',
    red: 'bg-red-50 text-red-600',
    amber: 'bg-amber-50 text-amber-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    sky: 'bg-sky-50 text-sky-600',
  }

  return (
    <Card className="flex items-center gap-3.5 p-4">
      <div className={cx('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', tintClasses[tint])}>
        <Icon size={19} />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-semibold text-ink-900">{value}</p>
        <p className="truncate text-xs font-medium text-ink-500">{label}</p>
      </div>
    </Card>
  )
}
