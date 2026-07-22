import { cx, initials } from '@/lib/utils'

const PALETTE = [
  'bg-brand-100 text-brand-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-sky-100 text-sky-700',
  'bg-pink-100 text-pink-700',
  'bg-orange-100 text-orange-700',
]

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

export function Avatar({ name, size = 'md', className }: { name: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizeClass = size === 'sm' ? 'h-6 w-6 text-[10px]' : size === 'lg' ? 'h-12 w-12 text-base' : 'h-9 w-9 text-xs'
  return (
    <div
      className={cx(
        'flex shrink-0 items-center justify-center rounded-full font-semibold',
        sizeClass,
        colorFor(name),
        className
      )}
      title={name}
    >
      {initials(name)}
    </div>
  )
}
