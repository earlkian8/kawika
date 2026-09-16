/**
 * Pure toast queue: what is on screen, in what order, and for how long.
 * Kept free of React so the rules are easy to test.
 */

export type ToastTone = 'success' | 'celebrate' | 'info' | 'warning' | 'error'
export type ToastIcon = 'check' | 'wave' | 'party' | 'sparkles' | 'logout' | 'alert'

export type ToastInput = {
  title: string
  description?: string
  tone?: ToastTone
  icon?: ToastIcon
  /** Milliseconds on screen. `null` keeps the toast until dismissed. */
  duration?: number | null
  /** Toasts sharing a key replace each other instead of stacking. Defaults to the title. */
  key?: string
}

export type Toast = {
  id: string
  key: string
  title: string
  description?: string
  tone: ToastTone
  icon: ToastIcon
  duration: number | null
  /** Bumped when a toast is replaced by one with the same key, restarting its timer. */
  revision: number
}

export const MAX_VISIBLE = 3

export const DEFAULT_DURATION: Record<ToastTone, number | null> = {
  success: 4500,
  info: 4500,
  celebrate: 6000,
  warning: 8000,
  // Errors stay until dismissed: people need time to read and act on them.
  error: null,
}

export const DEFAULT_ICON: Record<ToastTone, ToastIcon> = {
  success: 'check',
  info: 'sparkles',
  celebrate: 'party',
  warning: 'alert',
  error: 'alert',
}

export type ToastAction =
  | { type: 'show'; toast: Toast }
  | { type: 'dismiss'; id: string }
  | { type: 'dismissAll' }

let sequence = 0

export function createToast(input: ToastInput): Toast {
  const tone = input.tone ?? 'info'
  return {
    id: `toast-${++sequence}`,
    key: input.key ?? input.title,
    title: input.title,
    description: input.description,
    tone,
    icon: input.icon ?? DEFAULT_ICON[tone],
    duration: input.duration === undefined ? DEFAULT_DURATION[tone] : input.duration,
    revision: 0,
  }
}

/**
 * Newest first, at most MAX_VISIBLE. A repeated key replaces the older toast
 * and moves it to the top, keeping its id so it animates instead of remounting.
 */
export function toastReducer(state: Toast[], action: ToastAction): Toast[] {
  switch (action.type) {
    case 'show': {
      const existing = state.find((toast) => toast.key === action.toast.key)
      const next = existing ? { ...action.toast, id: existing.id, revision: existing.revision + 1 } : action.toast
      const rest = existing ? state.filter((toast) => toast !== existing) : state
      return [next, ...rest].slice(0, MAX_VISIBLE)
    }
    case 'dismiss':
      return state.filter((toast) => toast.id !== action.id)
    case 'dismissAll':
      return state.length ? [] : state
  }
}

/** Text read by screen readers for a toast. */
export function announcement(toast: Pick<Toast, 'title' | 'description'>): string {
  return toast.description ? `${toast.title} ${toast.description}` : toast.title
}
