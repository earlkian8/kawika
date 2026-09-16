import { Flame, Gem, Zap } from 'lucide-react'
import { LEARNER } from '@/features/progress/data/learner'
import '@/features/progress/styles/progress.css'

const numberFormat = new Intl.NumberFormat('en-PH')

/** Streak, XP, and perlas counters shown in the top bar. */
export function StatsBar() {
  return (
    <ul className="stats">
      <li className="stat stat--streak">
        <Flame size={24} strokeWidth={2.4} aria-hidden="true" />
        <span>{LEARNER.streak}</span>
        <span className="visually-hidden">day streak</span>
      </li>
      <li className="stat stat--xp">
        <Zap size={24} strokeWidth={2.4} aria-hidden="true" />
        <span>{numberFormat.format(LEARNER.xp)}</span>
        <span className="visually-hidden">total XP</span>
      </li>
      <li className="stat stat--perlas">
        <Gem size={24} strokeWidth={2.4} aria-hidden="true" />
        <span>{LEARNER.perlas}</span>
        <span className="visually-hidden">perlas</span>
      </li>
    </ul>
  )
}
