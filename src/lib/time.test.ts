import { describe, expect, it } from 'vitest'
import { formatCountdown, formatEat, formatEatFull, formatRelative, remainingMs } from './time'

describe('time', () => {
  const now = new Date('2026-10-15T11:36:00Z') // 14:36 EAT

  it('formats in EAT with a relative day', () => {
    expect(formatEat('2026-10-15T11:36:00Z', now)).toBe('Today 14:36')
    expect(formatEat('2026-10-14T06:05:00Z', now)).toBe('Yesterday 09:05')
    expect(formatEat('2026-10-12T11:36:00Z', now)).toBe('12 Oct 14:36')
    // 22:30 UTC is already the next day in Nairobi.
    expect(formatEat('2026-10-14T22:30:00Z', now)).toBe('Today 01:30')
  })

  it('counts down against server time, not the device clock', () => {
    const device = Date.parse('2026-10-15T11:00:00Z')
    // The phone is 5 minutes slow: the server says it is 11:05.
    expect(remainingMs('2026-10-15T11:10:00Z', 5 * 60_000, device)).toBe(5 * 60_000)
    expect(remainingMs('2026-10-15T10:00:00Z', 0, device)).toBe(0)
  })

  it('formats the ring text', () => {
    expect(formatCountdown(340_000)).toEqual({ lines: ['05:40'], spoken: '5 minutes 40 seconds left' })
    expect(formatCountdown((21 * 60 + 4) * 60_000)).toEqual({
      lines: ['21h', '04m'],
      spoken: '21 hours 4 minutes left',
    })
  })
})

describe('relative time', () => {
  const now = new Date('2026-10-24T12:00:00Z')
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString()

  it.each([
    [20_000, 'Just now'],
    [12 * 60_000, '12 min ago'],
    [60 * 60_000, '1 hour ago'],
    [3 * 3_600_000, '3 hours ago'],
    [30 * 3_600_000, 'Yesterday'],
    [5 * 86_400_000, '5 days ago'],
    [12 * 86_400_000, '12 Oct'],
  ])('%i ms ago reads "%s"', (ms, text) => {
    expect(formatRelative(ago(ms), now)).toBe(text)
  })

  it('gives the full EAT date for tooltips', () => {
    expect(formatEatFull('2026-10-24T11:36:00Z')).toBe('24 Oct 2026, 14:36')
  })
})
