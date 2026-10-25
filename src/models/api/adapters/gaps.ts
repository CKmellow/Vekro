/**
 * Backend gaps (docs/BACKEND_GAPS.md). Each open gap has a `VITE_MOCK_<FLAG>` env flag.
 * Adapters check `isMocked(gap)`; MSW handlers for a gap are only registered when its flag is on.
 * When the backend ships a gap: delete its handlers, its entry here and its flag.
 */
export const GAPS = {
  TIMELINE: { id: 'P1-5', issue: 142 },
  ANALYTICS: { id: 'P2-3', issue: 148 },
} as const

export type Gap = keyof typeof GAPS

const TRUE = new Set(['1', 'true', 'on', 'yes'])

/** Reads VITE_MOCK_* flags. `env` is injectable for tests. */
export function mockedGaps(env: Record<string, unknown> = import.meta.env): Set<Gap> {
  const on = new Set<Gap>()
  for (const gap of Object.keys(GAPS) as Gap[]) {
    const value = env[`VITE_MOCK_${gap}`]
    if (typeof value === 'string' && TRUE.has(value.toLowerCase())) on.add(gap)
  }
  return on
}

let cached: Set<Gap> | undefined

export function isMocked(gap: Gap): boolean {
  cached ??= mockedGaps()
  return cached.has(gap)
}
