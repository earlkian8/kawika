import { describe, expect, it } from 'vitest'
import { timeOfDayGreeting } from './greeting'

const at = (hour: number) => new Date(2026, 8, 16, hour)

describe('timeOfDayGreeting', () => {
  it.each([
    [4, 'Magandang umaga'],
    [10, 'Magandang umaga'],
    [11, 'Magandang tanghali'],
    [13, 'Magandang hapon'],
    [18, 'Magandang gabi'],
    [2, 'Magandang gabi'],
  ])('%i:00 is %s', (hour, greeting) => {
    expect(timeOfDayGreeting(at(hour))).toBe(greeting)
  })
})
