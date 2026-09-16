import { useCallback, useMemo, useReducer, useState, type ReactNode } from 'react'
import { Toaster } from '@/shared/ui/toast/Toaster'
import { ToastContext, type ToastApi } from '@/shared/ui/toast/toast-context'
import { announcement, createToast, toastReducer, type ToastInput } from '@/shared/ui/toast/toast-queue'

type Announcements = { polite: string; assertive: string }

/**
 * Owns the toast queue and the screen-reader live regions. Mount once, above
 * the router, so toasts survive navigation (e.g. log in, then land on home).
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, dispatch] = useReducer(toastReducer, [])
  const [announcements, setAnnouncements] = useState<Announcements>({ polite: '', assertive: '' })

  const show = useCallback((input: ToastInput) => {
    const toast = createToast(input)
    dispatch({ type: 'show', toast })
    const channel = toast.tone === 'error' ? 'assertive' : 'polite'
    // Clear first so repeating the same message is announced again.
    setAnnouncements((current) => ({ ...current, [channel]: '' }))
    window.setTimeout(() => setAnnouncements((current) => ({ ...current, [channel]: announcement(toast) })), 60)
    return toast.id
  }, [])

  const dismiss = useCallback((id: string) => dispatch({ type: 'dismiss', id }), [])
  const dismissAll = useCallback(() => dispatch({ type: 'dismissAll' }), [])

  const api = useMemo<ToastApi>(() => ({ show, dismiss, dismissAll }), [show, dismiss, dismissAll])

  return (
    <ToastContext.Provider value={api}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
      {/* Live regions exist from first paint so announcements are reliable. */}
      <div className="visually-hidden" role="status" aria-live="polite" aria-atomic="true">
        {announcements.polite}
      </div>
      {/* aria-live alone (no role="alert") keeps this from competing with inline form alerts. */}
      <div className="visually-hidden" aria-live="assertive" aria-atomic="true">
        {announcements.assertive}
      </div>
    </ToastContext.Provider>
  )
}
