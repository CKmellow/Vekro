/**
 * Backend gaps (docs/BACKEND_GAPS.md). Each open gap has a `VITE_MOCK_<FLAG>` env flag.
 * Adapters check `isMocked(gap)`; MSW handlers for a gap are only registered when its flag is on.
 * When the backend ships a gap: delete its handlers, its entry here and its flag.
 */
export const GAPS = {
  TRANSACTION_READ: { id: 'P0-1', issue: 6 },
  SELLER_LISTS: { id: 'P0-2', issue: 7 },
  PAYMENT_INSTRUCTION: { id: 'P0-3', issue: 8 },
  LISTING_UPDATE: { id: 'P0-6', issue: 140 },
  DEADLINES: { id: 'P0-7', issue: 141 },
  PUBLIC_ORDER: { id: 'P1-1', issue: 10 },
  PHONE_AUTH: { id: 'P1-2', issue: 11 },
  BUYER_ORDERS: { id: 'P1-3', issue: 12 },
  TIMELINE: { id: 'P1-5', issue: 142 },
  PAYMENT_STATUS: { id: 'P1-6', issue: 143 },
  SELLER_PROFILE: { id: 'P1-7', issue: 144 },
  NOTIFICATION_READ: { id: 'P1-8', issue: 145 },
  ESCALATE: { id: 'P1-9', issue: 146 },
  ADMIN_SEARCH: { id: 'P1-10', issue: 147 },
  ANALYTICS: { id: 'P2-3', issue: 148 },
  ACCOUNT_SECURITY: { id: 'P2-4', issue: 149 },
  NOTIFICATION_PREFS: { id: 'P2-5', issue: 150 },
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
