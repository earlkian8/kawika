import { LEAGUE } from '@/features/progress/data/learner'
import '@/features/progress/styles/progress.css'

/** Weekly league standings around the learner. */
export function LeagueCard() {
  return (
    <section className="rail-block league" aria-labelledby="league-title">
      <div className="rail-block__head">
        <h2 id="league-title">{LEAGUE.name}</h2>
        <span className="rail-block__aside">4 days left</span>
      </div>
      <p className="league__goal">
        Finish in the top {LEAGUE.promoteCount} to move up to {LEAGUE.next}.
      </p>
      <ol className="league__table">
        {LEAGUE.standings.map((row) => (
          <li key={row.rank} className={row.you ? 'league__row league__row--you' : 'league__row'}>
            <span className="league__rank">{row.rank}</span>
            <span className="league__name">{row.name}</span>
            <span className="league__xp">{row.xp} XP</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
