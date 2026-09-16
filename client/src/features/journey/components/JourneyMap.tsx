import { useCallback, useImperativeHandle, useRef, useState, type Ref } from 'react'
import { IslaCrossing } from '@/features/journey/components/IslaCrossing'
import { IslaSection } from '@/features/journey/components/IslaSection'
import { ISLANDS } from '@/features/journey/data/islands'
import { islandStartIndexes } from '@/features/journey/lib/route-layout'
import { useDismiss } from '@/shared/hooks/use-dismiss'
import '@/features/journey/styles/journey.css'

export type JourneyHandle = {
  /** Scroll to the learner's current quest, focus it, and open its details. */
  focusCurrent: () => void
}

const START_INDEXES = islandStartIndexes(ISLANDS)
const CURRENT_QUEST_ID = ISLANDS.flatMap((isla) => isla.quests).find((q) => q.state === 'current')?.id ?? null

/** The island-hopping route of quests on the home screen. */
export function JourneyMap({ ref }: { ref?: Ref<JourneyHandle> }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentRef = useRef<HTMLButtonElement>(null)
  const close = useCallback(() => setOpenId(null), [])

  useDismiss(openId !== null, containerRef, close)

  useImperativeHandle(ref, () => ({
    focusCurrent() {
      const node = currentRef.current
      if (!node) return
      node.scrollIntoView({ behavior: 'smooth', block: 'center' })
      node.focus({ preventScroll: true })
      setOpenId(CURRENT_QUEST_ID)
    },
  }))

  const toggle = useCallback((id: string) => setOpenId((current) => (current === id ? null : id)), [])

  return (
    <div className="journey" ref={containerRef}>
      {ISLANDS.map((isla, index) => {
        const next = ISLANDS[index + 1]
        return (
          <div key={isla.id}>
            <IslaSection
              isla={isla}
              startIndex={START_INDEXES[index]}
              openId={openId}
              onToggle={toggle}
              currentRef={currentRef}
            />
            {next && <IslaCrossing to={next} ready={isla.quests.every((q) => q.state === 'done')} />}
          </div>
        )
      })}
    </div>
  )
}
