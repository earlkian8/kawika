import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Lock } from 'lucide-react'
import type { CSSProperties, RefObject } from 'react'
import { QuestIcon } from '@/features/journey/components/QuestIcon'
import { KIND_LABEL, ROW_HEIGHT } from '@/features/journey/lib/route-layout'
import type { Quest } from '@/features/journey/types'

type Props = {
  quest: Quest
  x: number
  open: boolean
  onToggle: () => void
  buttonRef?: RefObject<HTMLButtonElement | null>
}

/** A single quest on the route, with its progress ring, callout, and details popover. */
export function QuestNode({ quest, x, open, onToggle, buttonRef }: Props) {
  const reduce = useReducedMotion()
  const popoverId = `quest-${quest.id}-details`
  const isCurrent = quest.state === 'current'
  const ratio = quest.progress ? quest.progress[0] / quest.progress[1] : 0
  const circumference = 2 * Math.PI * 47

  return (
    <li
      className={`quest quest--${quest.kind} quest--${quest.state}${open ? ' quest--open' : ''}${
        x > 0 ? ' quest--sway-right' : ''
      }`}
      style={{ height: ROW_HEIGHT, '--node-x': `${x}px` } as CSSProperties}
    >
      {isCurrent && !open && (
        <motion.span
          className="quest__callout"
          aria-hidden="true"
          style={{ y: '-50%' }}
          animate={reduce ? undefined : { x: x > 0 ? [0, -6, 0] : [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          Simulan
        </motion.span>
      )}

      <span className="quest__anchor">
        {isCurrent && (
          <svg className="quest__ring" viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="47" className="quest__ring-track" />
            <circle
              cx="50"
              cy="50"
              r="47"
              className="quest__ring-fill"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - ratio)}
            />
          </svg>
        )}
        <button
          ref={buttonRef}
          type="button"
          className="quest__button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={popoverId}
          aria-label={`${quest.title}. ${KIND_LABEL[quest.kind]}, ${
            quest.state === 'done' ? 'completed' : quest.state === 'current' ? 'up next' : 'locked'
          }`}
        >
          <QuestIcon quest={quest} />
        </button>
      </span>

      <AnimatePresence>
        {open && (
          <motion.div
            id={popoverId}
            className="quest__popover"
            role="dialog"
            aria-label={quest.title}
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 520, damping: 34 }}
            style={{ x: '-50%' }}
          >
            <span className="quest__popover-kind">{KIND_LABEL[quest.kind]}</span>
            <h3>{quest.title}</h3>
            <p>{quest.detail}</p>
            {quest.state === 'locked' ? (
              <p className="quest__popover-note">
                <Lock size={15} aria-hidden="true" /> Finish the quests before this one to unlock it.
              </p>
            ) : (
              <>
                {quest.progress && (
                  <p className="quest__popover-note">
                    Lesson {quest.progress[0] + 1} of {quest.progress[1]}
                  </p>
                )}
                <button type="button" className="btn quest__start">
                  {quest.state === 'done' ? 'Practice again' : 'Start'}
                  <span className="quest__xp">+{quest.state === 'done' ? Math.ceil(quest.xp / 2) : quest.xp} XP</span>
                </button>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  )
}
