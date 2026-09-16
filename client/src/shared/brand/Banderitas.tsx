import { motion, useReducedMotion } from 'motion/react'

const COLORS = ['var(--mangga)', 'var(--gumamela)', 'var(--capiz)', 'var(--bughaw)', 'var(--dahon)']

type Props = { count?: number; sag?: number; className?: string }

/**
 * Fiesta bunting strung across the top of a panel. Flags drop in once on load
 * and flutter when pointed at; there is no idle looping motion.
 */
export function Banderitas({ count = 13, sag = 70, className }: Props) {
  const reduce = useReducedMotion()
  const width = 1000
  const start = { x: -10, y: 8 }
  const control = { x: width / 2, y: 8 + sag * 2 }
  const end = { x: width + 10, y: 8 }

  const flags = Array.from({ length: count }, (_, i) => {
    const t = (i + 0.5) / count
    const x = (1 - t) ** 2 * start.x + 2 * (1 - t) * t * control.x + t ** 2 * end.x
    const y = (1 - t) ** 2 * start.y + 2 * (1 - t) * t * control.y + t ** 2 * end.y
    // Tangent of the curve, so each flag hangs square to the string.
    const dx = 2 * (1 - t) * (control.x - start.x) + 2 * t * (end.x - control.x)
    const dy = 2 * (1 - t) * (control.y - start.y) + 2 * t * (end.y - control.y)
    return { x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI, color: COLORS[i % COLORS.length] }
  })

  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${sag + 110}`}
      preserveAspectRatio="xMidYMin slice"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d={`M${start.x},${start.y} Q${control.x},${control.y} ${end.x},${end.y}`}
        fill="none"
        stroke="rgba(243, 241, 250, 0.55)"
        strokeWidth="2"
      />
      {flags.map((flag, i) => (
        <g key={i} transform={`translate(${flag.x} ${flag.y}) rotate(${flag.angle})`}>
          <motion.g
            style={{ transformBox: 'view-box', transformOrigin: '0px 0px' }}
            initial={reduce ? false : { y: -90, rotate: -14, opacity: 0 }}
            animate={{ y: 0, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 11, mass: 0.7, delay: 0.15 + i * 0.045 }}
            whileHover={reduce ? undefined : { rotate: [0, 12, -8, 4, 0], transition: { duration: 0.7 } }}
          >
            <path d="M-26,0 L26,0 L0,64 Z" fill={flag.color} />
            <path d="M-26,0 L26,0 L0,64 Z" fill="url(#banderita-sheen)" />
            <path d="M-19,6 L19,6" stroke="rgba(29, 24, 70, 0.18)" strokeWidth="2" strokeDasharray="4 4" />
          </motion.g>
        </g>
      ))}
      <defs>
        <linearGradient id="banderita-sheen" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0.22" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  )
}
