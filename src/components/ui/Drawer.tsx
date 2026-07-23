import type { ReactNode } from 'react'
import { X } from 'lucide-react'

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink-900/40" onClick={onClose}>
      <div
        className="animate-drawer-in flex h-full w-full max-w-lg flex-col bg-white shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between border-b border-ink-100 px-6 py-5">
          <div>
            <h2 className="text-lg font-semibold text-ink-900">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-ink-500">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-700"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-ink-100 px-6 py-4">{footer}</div>}
      </div>
    </div>
  )
}

export function DrawerSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-b border-ink-100 py-5 first:pt-0 last:border-0 last:pb-0">
      <p className="mb-3 text-sm font-semibold text-brand-700">{title}</p>
      <div className="space-y-4">{children}</div>
    </div>
  )
}
