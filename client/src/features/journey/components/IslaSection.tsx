import { BookOpen } from 'lucide-react'
import type { RefObject } from 'react'
import { QuestNode } from '@/features/journey/components/QuestNode'
import { journeyToasts } from '@/features/journey/lib/journey-toasts'
import { ROW_HEIGHT, routeGeometry } from '@/features/journey/lib/route-layout'
import type { Isla } from '@/features/journey/types'
import { useToast } from '@/shared/ui/toast/toast-context'

type Props = {
  isla: Isla
  startIndex: number
  openId: string | null
  onToggle: (id: string) => void
  currentRef: RefObject<HTMLButtonElement | null>
}

/** One island: its banner and the winding route of quests beneath it. */
export function IslaSection({ isla, startIndex, openId, onToggle, currentRef }: Props) {
  const toast = useToast()
  const done = isla.quests.filter((q) => q.state === 'done').length
  const locked = isla.quests.every((q) => q.state === 'locked')
  const { points, path } = routeGeometry(isla.quests.length, startIndex)
  const height = isla.quests.length * ROW_HEIGHT

  return (
    <section className={`isla isla--${isla.color}${locked ? ' isla--locked' : ''}`} aria-labelledby={`isla-${isla.id}`}>
      <header className="isla__banner">
        <div>
          <p className="isla__number">Isla {isla.number}</p>
          <h2 id={`isla-${isla.id}`}>{isla.name}</h2>
          <p className="isla__english">{isla.english}</p>
        </div>
        <div className="isla__meta">
          <span className="isla__count" aria-label={`${done} of ${isla.quests.length} quests done`}>
            {done}/{isla.quests.length}
          </span>
          <button
            type="button"
            className="isla__guide"
            disabled={locked}
            onClick={() => toast.show(journeyToasts.guideComingSoon(isla))}
          >
            <BookOpen size={18} aria-hidden="true" />
            <span>Guide</span>
          </button>
        </div>
      </header>

      <div className="isla__route" style={{ height }}>
        <svg
          className="isla__path"
          viewBox={`-150 0 300 ${height}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <path d={path} vectorEffect="non-scaling-stroke" />
        </svg>
        <ol className="isla__quests">
          {isla.quests.map((quest, i) => (
            <QuestNode
              key={quest.id}
              quest={quest}
              x={points[i].x}
              open={openId === quest.id}
              onToggle={() => onToggle(quest.id)}
              buttonRef={quest.state === 'current' ? currentRef : undefined}
            />
          ))}
        </ol>
      </div>
    </section>
  )
}
