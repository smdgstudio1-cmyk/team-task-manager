import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/utils'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-2xl border border-white/8 bg-ink-800 p-5 shadow-soft', className)}
      {...props}
    >
      {children}
    </div>
  )
}
