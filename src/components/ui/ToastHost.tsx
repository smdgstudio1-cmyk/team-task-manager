import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useToastStore } from '@/store/toastStore'
import { cx } from '@/lib/utils'

const STYLES = {
  success: { icon: CheckCircle2, bg: 'bg-emerald-600', },
  error: { icon: XCircle, bg: 'bg-red-600' },
  info: { icon: Info, bg: 'bg-ink-800' },
}

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts)
  const dismiss = useToastStore((s) => s.dismiss)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((t) => {
        const style = STYLES[t.variant]
        const Icon = style.icon
        return (
          <div
            key={t.id}
            className={cx(
              'animate-slide-in flex max-w-sm items-start gap-2.5 rounded-xl px-4 py-3 text-sm text-white shadow-soft-lg',
              style.bg
            )}
          >
            <Icon size={16} className="mt-0.5 shrink-0" />
            <p className="flex-1">{t.message}</p>
            <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
              <X size={14} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
