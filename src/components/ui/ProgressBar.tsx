import { cx } from '@/lib/utils'

export function ProgressBar({
  value,
  className,
  colorClassName = 'bg-brand-500',
  trackClassName = 'bg-white/8',
  size = 'md',
}: {
  value: number
  className?: string
  colorClassName?: string
  trackClassName?: string
  size?: 'sm' | 'md'
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div className={cx('w-full overflow-hidden rounded-full', trackClassName, size === 'sm' ? 'h-1.5' : 'h-2.5', className)}>
      <div
        className={cx('h-full rounded-full transition-all duration-300', colorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}
