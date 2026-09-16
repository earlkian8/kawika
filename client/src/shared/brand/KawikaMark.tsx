import '@/shared/brand/brand.css'
import { motion, useReducedMotion } from 'motion/react'

type Props = { size?: number; animated?: boolean; className?: string }

const PENNANTS = [
  { d: 'M14 16.6 L26 21.6 L19 46 Z', fill: 'var(--mangga)' },
  { d: 'M29 22.4 L41 21.2 L35.5 50 Z', fill: 'var(--gumamela)' },
  { d: 'M44 20.2 L54 15.8 L50.5 40 Z', fill: 'var(--bughaw)' },
]

/** Three banderitas on a string: the Kawika logomark. */
export function KawikaMark({ size = 36, animated = false, className }: Props) {
  const reduce = useReducedMotion()
  const sway = animated && !reduce

  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      aria-hidden="true"
      focusable="false"
    >
      <rect width="64" height="64" rx="16" fill="var(--tinta)" />
      <path d="M8 14 Q32 26 56 14" fill="none" stroke="var(--capiz)" strokeWidth="2.5" strokeLinecap="round" />
      {PENNANTS.map((p, i) => (
        <motion.path
          key={p.d}
          d={p.d}
          fill={p.fill}
          style={{ transformBox: 'fill-box', transformOrigin: '50% 0%' }}
          animate={sway ? { rotate: [0, i % 2 ? -9 : 9, 0] } : undefined}
          transition={sway ? { duration: 1.1, repeat: Infinity, delay: i * 0.14, ease: 'easeInOut' } : undefined}
        />
      ))}
    </svg>
  )
}

export function KawikaWordmark({ size = 34 }: { size?: number }) {
  return (
    <span className="wordmark" style={{ fontSize: size * 0.72 }}>
      <KawikaMark size={size} />
      <span>Kawika</span>
    </span>
  )
}
