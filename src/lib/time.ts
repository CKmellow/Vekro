/** All times display in EAT (Africa/Nairobi). Countdowns use server time, never the device clock alone. */
const TZ = 'Africa/Nairobi'

const clock = new Intl.DateTimeFormat('en-GB', {
  timeZone: TZ,
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})
const day = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, day: 'numeric', month: 'short' })
const dayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: TZ,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** "Today 14:36", "Yesterday 09:05" or "12 Oct 14:36", in EAT. */
export function formatEat(iso: string, now: Date = new Date()): string {
  const date = new Date(iso)
  const key = dayKey.format(date)
  const yesterday = new Date(now.getTime() - 86_400_000)
  const prefix =
    key === dayKey.format(now) ? 'Today' : key === dayKey.format(yesterday) ? 'Yesterday' : day.format(date)
  return `${prefix} ${clock.format(date)}`
}

/**
 * Milliseconds left until a server deadline. `serverOffsetMs` is server time minus device time,
 * measured when the data was fetched (for example from the response Date header), so a wrong phone clock
 * does not move the deadline.
 */
export function remainingMs(deadlineIso: string, serverOffsetMs = 0, deviceNow = Date.now()): number {
  return Math.max(0, new Date(deadlineIso).getTime() - (deviceNow + serverOffsetMs))
}

/** Ring text and the words screen readers hear. Under an hour: "05:40"; otherwise "21h" over "04m". */
export function formatCountdown(ms: number): { lines: string[]; spoken: string } {
  const total = Math.ceil(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'}`
  if (h > 0)
    return { lines: [`${h}h`, `${pad(m)}m`], spoken: `${plural(h, 'hour')} ${plural(m, 'minute')} left` }
  return { lines: [`${pad(m)}:${pad(s)}`], spoken: `${plural(m, 'minute')} ${plural(s, 'second')} left` }
}
