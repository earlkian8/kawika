import { Sailboat } from 'lucide-react'
import type { Isla } from '@/features/journey/types'

/** Sea crossing between two islands on the journey. */
export function IslaCrossing({ to, ready }: { to: Isla; ready: boolean }) {
  return (
    <div className={`crossing crossing--${to.color}`}>
      <svg className="crossing__waves" viewBox="0 0 320 24" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 12 Q 20 2 40 12 T 80 12 T 120 12 T 160 12 T 200 12 T 240 12 T 280 12 T 320 12" />
      </svg>
      <span className="crossing__label">
        <Sailboat size={20} aria-hidden="true" />
        {ready ? `Set sail for ${to.name}` : `Next: Isla ${to.number}, ${to.name}`}
      </span>
    </div>
  )
}
