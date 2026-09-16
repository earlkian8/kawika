import { Gift } from 'lucide-react'
import { DAILY_QUESTS } from '@/features/progress/data/learner'
import '@/features/progress/styles/progress.css'

/** Today's three micro goals with progress bars. */
export function DailyQuests() {
  return (
    <section className="rail-block daily" aria-labelledby="daily-title">
      <div className="rail-block__head">
        <h2 id="daily-title">Today's quests</h2>
        <span className="rail-block__aside">Resets at midnight</span>
      </div>
      <ul className="daily__list">
        {DAILY_QUESTS.map((quest) => {
          const complete = quest.value >= quest.goal
          return (
            <li key={quest.id} className={`daily__item${complete ? ' daily__item--done' : ''}`}>
              <div className="daily__body">
                <p>{quest.title}</p>
                <div
                  className="daily__bar"
                  role="progressbar"
                  aria-label={quest.title}
                  aria-valuemin={0}
                  aria-valuemax={quest.goal}
                  aria-valuenow={quest.value}
                >
                  <span style={{ width: `${(quest.value / quest.goal) * 100}%` }} />
                  <em>
                    {quest.value} / {quest.goal}
                  </em>
                </div>
              </div>
              <Gift size={30} strokeWidth={2.2} className="daily__chest" aria-hidden="true" />
            </li>
          )
        })}
      </ul>
    </section>
  )
}
