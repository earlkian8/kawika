/** Filipino greeting for the hour of the day. */
export function timeOfDayGreeting(date = new Date()): string {
  const hour = date.getHours()
  if (hour >= 4 && hour < 11) return 'Magandang umaga'
  if (hour >= 11 && hour < 13) return 'Magandang tanghali'
  if (hour >= 13 && hour < 18) return 'Magandang hapon'
  return 'Magandang gabi'
}
