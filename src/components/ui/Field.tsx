import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'

const baseInput =
  'w-full rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-sm text-ink-100 placeholder:text-ink-500 [color-scheme:dark] focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20'

export function FieldWrap({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink-300">{label}</span>
      {children}
    </label>
  )
}

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={baseInput + ' ' + (props.className || '')} />
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={baseInput + ' resize-none ' + (props.className || '')} />
}

export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={baseInput + ' ' + (props.className || '')} />
}
