import { AnimatePresence } from 'motion/react'
import { useEffect, useRef, useState, type FocusEvent } from 'react'
import { ToastCard } from '@/shared/ui/toast/ToastCard'
import type { Toast } from '@/shared/ui/toast/toast-queue'
import '@/shared/ui/toast/toast.css'

type Props = { toasts: Toast[]; onDismiss: (id: string) => void }

/** The on-screen stack. Timers pause while it is hovered, focused, or the tab is hidden. */
export function Toaster({ toasts, onDismiss }: Props) {
  const listRef = useRef<HTMLOListElement>(null)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(() => document.hidden)

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const paused = hovered || focused || hidden

  const onBlur = (event: FocusEvent<HTMLOListElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
  }

  // A removed toast fires neither pointerleave nor blur, so re-check afterwards.
  const resyncPause = () => {
    const list = listRef.current
    setHovered(!!list?.matches(':hover'))
    setFocused(!!list?.contains(document.activeElement))
  }

  return (
    <section className="toaster" aria-label="Notifications">
      <ol
        ref={listRef}
        className="toaster__list"
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onFocus={() => setFocused(true)}
        onBlur={onBlur}
      >
        <AnimatePresence initial={false} onExitComplete={resyncPause}>
          {toasts.map((toast) => (
            <ToastCard key={toast.id} toast={toast} paused={paused} onDismiss={onDismiss} />
          ))}
        </AnimatePresence>
      </ol>
    </section>
  )
}
