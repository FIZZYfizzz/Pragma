import { create } from 'zustand'
import { nanoid } from 'nanoid'

export type ToastKind = 'success' | 'error' | 'info'

export interface Toast {
  id: string
  kind: ToastKind
  message: string
}

interface ToastStore {
  toasts: Toast[]
  show: (kind: ToastKind, message: string) => void
  dismiss: (id: string) => void
}

const TOAST_DURATION_MS = 3500

export const useToastStore = create<ToastStore>((set, get) => ({
  toasts: [],

  show(kind, message) {
    const id = nanoid(8)
    set((s) => ({ toasts: [...s.toasts.slice(-3), { id, kind, message }] }))
    setTimeout(() => get().dismiss(id), TOAST_DURATION_MS)
  },

  dismiss(id) {
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
  },
}))

export const toast = {
  success: (message: string) => useToastStore.getState().show('success', message),
  error: (message: string) => useToastStore.getState().show('error', message),
  info: (message: string) => useToastStore.getState().show('info', message),
}
