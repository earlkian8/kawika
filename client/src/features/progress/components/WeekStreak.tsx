import { Flame } from 'lucide-react'
import { LEARNER, WEEKDAYS } from '@/features/progress/data/learner'
import '@/features/progress/styles/progress.css'

/** Current streak with the week laid out Lunes to Linggo. */
export function WeekStreak() {
  return (
    <section className="rail-block streak" aria-labelledby="streak-title">
      <div className="streak__flame" aria-hidden="true">
        <Flame size={44} strokeWidth={2.2} />
      </div>
      <div>
        <h2 id="streak-title">{LEARNER.streak}-day streak</h2>
        <p>Practice today to make it {LEARNER.streak + 1}.</p>
      </div>
      <ol className="streak__week">
        {WEEKDAYS.map((day, i) => {
          const state = i < LEARNER.todayIndex ? 'done' : i === LEARNER.todayIndex ? 'today' : 'ahead'
          return (
            <li key={day.long} className={`streak__day streak__day--${state}`}>
              <abbr title={day.long}>{day.short}</abbr>
              <span className="visually-hidden">
                {state === 'done' ? 'practiced' : state === 'today' ? 'today, not yet practiced' : 'upcoming'}
              </span>
            </li>
          )
        })}
      </ol>
    </section>
  )
}
