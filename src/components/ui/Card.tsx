import type { HTMLAttributes } from 'react'
import { cx } from '@/lib/utils'

export function Card({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx('rounded-2xl border border-ink-200/70 bg-white p-5 shadow-soft', className)}
      {...props}
    >
      {children}
    </div>
  )
}
