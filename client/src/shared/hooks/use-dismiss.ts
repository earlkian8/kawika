import { useEffect, type RefObject } from 'react'

/**
 * Calls `onDismiss` on Escape or on a pointer press outside `container`
 * while `active` is true. Shared by popovers and menus.
 */
export function useDismiss(active: boolean, container: RefObject<HTMLElement | null>, onDismiss: () => void) {
  useEffect(() => {
    if (!active) return
    const onPointer = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) onDismiss()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onDismiss()
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [active, container, onDismiss])
}
