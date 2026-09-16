// Mock learner progress for the home screen. Replace with API data once the
// progress endpoints exist.

export const LEARNER = {
  streak: 12,
  xp: 1240,
  perlas: 350,
  // Monday-first index of today; mock practice on every earlier day this week.
  todayIndex: (new Date().getDay() + 6) % 7,
}

export const WEEKDAYS = [
  { short: 'L', long: 'Lunes' },
  { short: 'M', long: 'Martes' },
  { short: 'M', long: 'Miyerkoles' },
  { short: 'H', long: 'Huwebes' },
  { short: 'B', long: 'Biyernes' },
  { short: 'S', long: 'Sabado' },
  { short: 'L', long: 'Linggo' },
]

export const DAILY_QUESTS = [
  { id: 'd1', title: 'Earn 30 XP', value: 20, goal: 30 },
  { id: 'd2', title: 'Learn 5 new signs', value: 5, goal: 5 },
  { id: 'd3', title: 'Finish 3 lessons without a mistake', value: 1, goal: 3 },
]

export const LEAGUE = {
  name: 'Perlas League',
  next: 'Sampaguita League',
  promoteCount: 7,
  standings: [
    { rank: 1, name: 'Bea R.', xp: 612 },
    { rank: 2, name: 'Jomar', xp: 540 },
    { rank: 3, name: 'Tin Dela Cruz', xp: 498 },
    { rank: 4, name: 'You', xp: 455, you: true },
    { rank: 5, name: 'Paolo M.', xp: 431 },
  ],
}
