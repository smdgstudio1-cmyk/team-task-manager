import { create } from 'zustand'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: string
  message: string
  variant: ToastVariant
}

interface ToastState {
  toasts: ToastItem[]
  show: (message: string, variant?: ToastVariant) => void
  dismiss: (id: string) => void
}

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show: (message, variant = 'info') => {
    const id = crypto.randomUUID()
    set({ toasts: [...get().toasts, { id, message, variant }] })
    setTimeout(() => get().dismiss(id), 4000)
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}))

export const toast = {
  success: (message: string) => useToastStore.getState().show(message, 'success'),
  error: (message: string) => useToastStore.getState().show(message, 'error'),
  info: (message: string) => useToastStore.getState().show(message, 'info'),
}
