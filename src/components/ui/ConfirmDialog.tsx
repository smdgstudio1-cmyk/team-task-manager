import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from './Button'
import { cx } from '@/lib/utils'

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  variant = 'danger',
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void | Promise<void>
  title: string
  description: string
  confirmLabel?: string
  variant?: 'danger' | 'primary'
}) {
  const [submitting, setSubmitting] = useState(false)
  if (!open) return null

  async function handleConfirm() {
    setSubmitting(true)
    await onConfirm()
    setSubmitting(false)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        className="glass animate-fade-in w-full max-w-sm rounded-2xl border border-white/10 p-5 shadow-soft-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div
            className={cx(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              variant === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-brand-500/15 text-brand-400'
            )}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h3 className="text-sm font-semibold text-ink-50">{title}</h3>
            <p className="mt-1 text-sm text-ink-400">{description}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} size="sm" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Please wait...' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
