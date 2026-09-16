export type IslaColor = 'bughaw' | 'gumamela' | 'dahon' | 'mangga' | 'tinta'
export type QuestKind = 'lesson' | 'practice' | 'scenario' | 'chest' | 'review'
export type QuestState = 'done' | 'current' | 'locked'

export type Quest = {
  id: string
  kind: QuestKind
  title: string
  detail: string
  xp: number
  state: QuestState
  /** For the current quest: lessons finished out of total. */
  progress?: [number, number]
  scene?: 'store' | 'bus' | 'home' | 'school' | 'party'
}

export type Isla = {
  id: string
  number: number
  name: string
  english: string
  color: IslaColor
  quests: Quest[]
}
