import { Bus, Check, Crown, Dumbbell, Gift, Hand, Home, Lock, PartyPopper, School, Store, type LucideIcon } from 'lucide-react'
import type { Quest } from '@/features/journey/types'

const SCENE_ICONS: Record<NonNullable<Quest['scene']>, LucideIcon> = {
  store: Store,
  bus: Bus,
  home: Home,
  school: School,
  party: PartyPopper,
}

export function QuestIcon({ quest }: { quest: Quest }) {
  const props = { size: quest.kind === 'scenario' ? 34 : 30, strokeWidth: 2.5, 'aria-hidden': true } as const
  if (quest.state === 'locked' && quest.kind !== 'chest') return <Lock {...props} />
  if (quest.kind === 'scenario' && quest.scene) {
    const Scene = SCENE_ICONS[quest.scene]
    return <Scene {...props} />
  }
  if (quest.kind === 'chest') return <Gift {...props} />
  if (quest.kind === 'practice') return <Dumbbell {...props} />
  if (quest.kind === 'review') return <Crown {...props} />
  return quest.state === 'done' ? <Check {...props} /> : <Hand {...props} />
}
