import { useEffect, useRef } from 'react'
import { useAuth } from '@/features/auth/context/auth-context'
import { JourneyMap, type JourneyHandle } from '@/features/journey/components/JourneyMap'
import { ISLANDS } from '@/features/journey/data/islands'
import { DailyQuests } from '@/features/progress/components/DailyQuests'
import { LeagueCard } from '@/features/progress/components/LeagueCard'
import { WeekStreak } from '@/features/progress/components/WeekStreak'
import { timeOfDayGreeting } from '@/pages/home/greeting'
import { Button } from '@/shared/ui/Button'
import './home-page.css'

const CURRENT = ISLANDS.flatMap((isla) => isla.quests.map((quest) => ({ isla, quest }))).find(
  ({ quest }) => quest.state === 'current',
)

/** Signed-in home: greeting, the journey map, and the progress rail. */
export default function HomePage() {
  const { user } = useAuth()
  const journey = useRef<JourneyHandle>(null)
  const firstName = user?.display_name.split(' ')[0] ?? ''

  useEffect(() => {
    document.title = 'Your journey: Kawika'
  }, [])

  return (
    <div className="home">
      <section className="home__main" aria-label="Journey">
        <div className="intro">
          <h1>
            {timeOfDayGreeting()}, {firstName}.
          </h1>
          {CURRENT && (
            <div className="intro__next">
              <p>
                Up next in {CURRENT.isla.name}: <strong>{CURRENT.quest.title}</strong>
                {CURRENT.quest.progress && `, lesson ${CURRENT.quest.progress[0] + 1} of ${CURRENT.quest.progress[1]}`}.
              </p>
              <Button variant="mangga" onClick={() => journey.current?.focusCurrent()}>
                Continue quest
              </Button>
            </div>
          )}
        </div>
        <JourneyMap ref={journey} />
      </section>

      <aside className="home__rail" aria-label="Progress">
        <WeekStreak />
        <DailyQuests />
        <LeagueCard />
      </aside>
    </div>
  )
}
