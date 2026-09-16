import { animate, motion, useMotionValue, useReducedMotion, type PanInfo } from 'motion/react'
import { Check, LogOut, PartyPopper, Sparkles, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { useEffect, useRef, type KeyboardEvent } from 'react'
import type { Toast, ToastIcon } from '@/shared/ui/toast/toast-queue'

const ICONS: Record<Exclude<ToastIcon, 'wave'>, LucideIcon> = {
  check: Check,
  party: PartyPopper,
  sparkles: Sparkles,
  logout: LogOut,
  alert: TriangleAlert,
}

const BURST_COLORS = ['var(--mangga)', 'var(--gumamela)', 'var(--bughaw)', 'var(--dahon)']
const SWIPE_DISTANCE = 90
const SWIPE_VELOCITY = 600

type Props = { toast: Toast; paused: boolean; onDismiss: (id: string) => void }

/** A waving hand: hello and goodbye in a sign language app. */
function WaveIcon({ animate: wave }: { animate: boolean }) {
  return (
    <motion.svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ originX: 0.7, originY: 0.9 }}
      initial={false}
      animate={wave ? { rotate: [0, 18, -10, 18, -4, 0] } : undefined}
      transition={{ duration: 1.1, delay: 0.25, ease: 'easeInOut' }}
    >
      {/* lucide "hand" glyph */}
      <path d="M18 11V6a2 2 0 0 0-4 0v5" />
      <path d="M14 10V4a2 2 0 0 0-4 0v2" />
      <path d="M10 10.5V6a2 2 0 0 0-4 0v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </motion.svg>
  )
}

/** Eight bunting flags that pop out of the medallion once. */
function BannerBurst() {
  return (
    <span className="toast__burst" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 - Math.PI / 2
        return (
          <motion.span
            key={i}
            className="toast__flag"
            style={{ background: BURST_COLORS[i % BURST_COLORS.length] }}
            initial={{ x: 0, y: 0, scale: 0.4, opacity: 0, rotate: 0 }}
            animate={{
              x: Math.cos(angle) * 34,
              y: Math.sin(angle) * 34,
              scale: [0.4, 1, 0.8],
              opacity: [0, 1, 0],
              rotate: (angle * 180) / Math.PI + 90,
            }}
            transition={{ duration: 0.9, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          />
        )
      })}
    </span>
  )
}

export function ToastCard({ toast, paused, onDismiss }: Props) {
  const reduce = useReducedMotion()
  const x = useMotionValue(0)
  const remaining = useRef(toast.duration ?? 0)
  const revision = useRef(toast.revision)

  // Auto-dismiss timer that pauses without losing elapsed time and restarts
  // when the toast is replaced by a newer message with the same key.
  useEffect(() => {
    if (toast.duration === null) return
    if (revision.current !== toast.revision) {
      revision.current = toast.revision
      remaining.current = toast.duration
    }
    if (paused) return
    const startedAt = Date.now()
    const timer = window.setTimeout(() => onDismiss(toast.id), remaining.current)
    return () => {
      window.clearTimeout(timer)
      remaining.current = Math.max(0, remaining.current - (Date.now() - startedAt))
    }
  }, [paused, toast.duration, toast.revision, toast.id, onDismiss])

  const onDragEnd = (_event: PointerEvent, info: PanInfo) => {
    const flung = Math.abs(info.offset.x) > SWIPE_DISTANCE || Math.abs(info.velocity.x) > SWIPE_VELOCITY
    if (!flung) {
      animate(x, 0, { type: 'spring', stiffness: 600, damping: 32 })
      return
    }
    const direction = Math.sign(info.offset.x || info.velocity.x) || 1
    animate(x, direction * 480, { duration: 0.2, ease: 'easeIn' }).then(() => onDismiss(toast.id))
  }

  const onKeyDown = (event: KeyboardEvent<HTMLLIElement>) => {
    if (event.key === 'Escape') onDismiss(toast.id)
  }

  const Icon = toast.icon === 'wave' ? null : ICONS[toast.icon]
  const timed = toast.duration !== null

  return (
    <motion.li
      layout={!reduce}
      className={`toast toast--${toast.tone}`}
      data-tone={toast.tone}
      style={{ x }}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -36, rotate: -2.5, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -14, scale: 0.94, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 520, damping: 28, mass: 0.8 }}
      drag={reduce ? false : 'x'}
      dragElastic={0.5}
      onDragEnd={onDragEnd}
      onKeyDown={onKeyDown}
    >
      <span className="toast__medallion" aria-hidden="true">
        <motion.span
          className="toast__icon"
          key={`icon-${toast.revision}`}
          initial={reduce ? false : { scale: 0.3, rotate: -25 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 600, damping: 14, delay: 0.08 }}
        >
          {Icon ? <Icon size={22} strokeWidth={2.6} /> : <WaveIcon animate={!reduce} />}
        </motion.span>
        {toast.tone === 'celebrate' && !reduce && <BannerBurst key={`burst-${toast.revision}`} />}
      </span>

      <div className="toast__body">
        <p className="toast__title">{toast.title}</p>
        {toast.description && <p className="toast__description">{toast.description}</p>}
      </div>

      <button type="button" className="toast__close" onClick={() => onDismiss(toast.id)} aria-label="Dismiss notification">
        <X size={18} strokeWidth={2.6} aria-hidden="true" />
      </button>

      {timed && (
        <span
          key={`timer-${toast.revision}`}
          className="toast__timer"
          style={{ animationDuration: `${toast.duration}ms` }}
          data-paused={paused || undefined}
          aria-hidden="true"
        />
      )}
    </motion.li>
  )
}
