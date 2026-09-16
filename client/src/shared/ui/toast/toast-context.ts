import { createContext, useContext } from 'react'
import type { ToastInput } from '@/shared/ui/toast/toast-queue'

export type ToastApi = {
  /** Show a toast and return its id. */
  show: (input: ToastInput) => string
  dismiss: (id: string) => void
  /** Clear every toast, e.g. when the context they refer to is gone. */
  dismissAll: () => void
}

export const ToastContext = createContext<ToastApi | null>(null)

export function useToast(): ToastApi {
  const value = useContext(ToastContext)
  if (!value) throw new Error('useToast must be used inside <ToastProvider>')
  return value
}
