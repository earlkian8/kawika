// Mock progress data for the home screen. Replace with API data once the
// learning endpoints exist. Quest titles are placeholders; the signs taught
// in each quest should come from Deaf FSL signers and interpreters.

import type { Isla } from '@/features/journey/types'

export const ISLANDS: Isla[] = [
  {
    id: 'pagbati',
    number: 1,
    name: 'Pagbati',
    english: 'Greetings and introductions',
    color: 'bughaw',
    quests: [
      { id: 'p1', kind: 'lesson', title: 'Kumusta?', detail: 'Hello, good morning, thank you', xp: 10, state: 'done' },
      { id: 'p2', kind: 'lesson', title: 'Ang aking pangalan', detail: 'Fingerspell your name', xp: 10, state: 'done' },
      { id: 'p3', kind: 'practice', title: 'Quick drill', detail: 'Watch the sign, pick the meaning', xp: 5, state: 'done' },
      { id: 'p4', kind: 'chest', title: 'Baon chest', detail: 'A small reward for the road', xp: 20, state: 'done' },
      {
        id: 'p5',
        kind: 'scenario',
        scene: 'school',
        title: 'First day of class',
        detail: 'Introduce yourself to a Deaf classmate',
        xp: 25,
        state: 'done',
      },
    ],
  },
  {
    id: 'pamilya',
    number: 2,
    name: 'Pamilya',
    english: 'Family',
    color: 'gumamela',
    quests: [
      { id: 'f1', kind: 'lesson', title: 'Nanay at Tatay', detail: 'Mother, father, parents', xp: 10, state: 'done' },
      { id: 'f2', kind: 'lesson', title: 'Kuya at Ate', detail: 'Older brother and sister', xp: 10, state: 'done' },
      {
        id: 'f3',
        kind: 'lesson',
        title: 'Lolo at Lola',
        detail: 'Grandparents, titos, titas',
        xp: 15,
        state: 'current',
        progress: [2, 5],
      },
      { id: 'f4', kind: 'practice', title: 'Family tree drill', detail: 'Match each sign to a relative', xp: 5, state: 'locked' },
      {
        id: 'f5',
        kind: 'scenario',
        scene: 'home',
        title: 'Family reunion',
        detail: 'Introduce your family at a Sunday lunch',
        xp: 30,
        state: 'locked',
      },
      { id: 'f6', kind: 'chest', title: 'Pasalubong chest', detail: 'Something to bring home', xp: 20, state: 'locked' },
    ],
  },
  {
    id: 'sari-sari',
    number: 3,
    name: 'Sari-sari store',
    english: 'Numbers and shopping',
    color: 'dahon',
    quests: [
      { id: 's1', kind: 'lesson', title: 'Numbers 1 to 20', detail: 'Count on one hand, then two', xp: 10, state: 'locked' },
      { id: 's2', kind: 'lesson', title: 'Magkano?', detail: 'Ask how much something costs', xp: 10, state: 'locked' },
      { id: 's3', kind: 'practice', title: 'Price check', detail: 'Read prices signed at speed', xp: 5, state: 'locked' },
      {
        id: 's4',
        kind: 'scenario',
        scene: 'store',
        title: "At Aling Nena's store",
        detail: 'Buy pandesal and ask for change',
        xp: 30,
        state: 'locked',
      },
      { id: 's5', kind: 'review', title: 'Isla review', detail: 'Everything from islands 1 to 3', xp: 40, state: 'locked' },
    ],
  },
  {
    id: 'jeepney',
    number: 4,
    name: 'Sa jeepney',
    english: 'Getting around',
    color: 'mangga',
    quests: [
      { id: 'j1', kind: 'lesson', title: 'Left, right, straight', detail: 'Directions and landmarks', xp: 10, state: 'locked' },
      { id: 'j2', kind: 'lesson', title: 'Para po!', detail: 'Stopping, paying, getting off', xp: 10, state: 'locked' },
      {
        id: 'j3',
        kind: 'scenario',
        scene: 'bus',
        title: 'Ride to the palengke',
        detail: 'Tell the driver where to stop',
        xp: 30,
        state: 'locked',
      },
      { id: 'j4', kind: 'chest', title: 'Barya chest', detail: 'Keep the change', xp: 20, state: 'locked' },
    ],
  },
  {
    id: 'pista',
    number: 5,
    name: 'Pista',
    english: 'Food and celebration',
    color: 'tinta',
    quests: [
      { id: 'k1', kind: 'lesson', title: 'Handa', detail: 'Lechon, pancit, kakanin', xp: 10, state: 'locked' },
      {
        id: 'k2',
        kind: 'scenario',
        scene: 'party',
        title: 'Fiesta in the barangay',
        detail: 'Greet neighbors and talk about the food',
        xp: 35,
        state: 'locked',
      },
      { id: 'k3', kind: 'review', title: 'Kapuluan finale', detail: 'A final test across every island', xp: 60, state: 'locked' },
    ],
  },
]
