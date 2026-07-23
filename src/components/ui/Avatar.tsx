import { cx, initials } from '@/lib/utils'

const PALETTE = [
  'bg-brand-500/15 text-brand-300',
  'bg-emerald-500/15 text-emerald-400',
  'bg-amber-500/15 text-amber-400',
  'bg-sky-500/15 text-sky-400',
  'bg-pink-500/15 text-pink-400',
  'bg-orange-500/15 text-orange-400',
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
