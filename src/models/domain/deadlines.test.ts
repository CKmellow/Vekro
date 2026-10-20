import { describe, expect, it } from 'vitest'
import { currentDeadline, msLeft } from './deadlines'
import type { OrderDeadlines } from './order'

const none: OrderDeadlines = {
  dispatchBy: null,
  inspectBy: null,
  holdUntil: null,
  returnSendBy: null,
  returnConfirmBy: null,
}
const updatedAt = '2026-10-20T09:00:00Z'

describe('deadlines', () => {
  it.each([
    ['locked', 'dispatchBy', 'dispatch', 48 * 3_600_000],
    ['at_door_pending_inspection', 'inspectBy', 'inspect', 3_600_000],
    ['hold_24h', 'holdUntil', 'hold', 24 * 3_600_000],
    ['disputed_functional', 'returnSendBy', 'return_send', 3 * 86_400_000],
    ['return_in_transit', 'returnConfirmBy', 'return_confirm', 3 * 86_400_000],
  ] as const)('%s uses the server deadline', (status, field, kind, totalMs) => {
    const deadline = currentDeadline({
      status,
      updatedAt,
      deadlines: { ...none, [field]: '2026-10-21T10:00:00Z' },
    })
    expect(deadline).toEqual({ kind, at: '2026-10-21T10:00:00Z', totalMs, approximate: false })
  })

  it('derives an approximate deadline from the state change when the server sent none', () => {
    expect(currentDeadline({ status: 'at_door_pending_inspection', updatedAt, deadlines: none })).toEqual({
      kind: 'inspect',
      at: '2026-10-20T10:00:00.000Z',
      totalMs: 3_600_000,
      approximate: true,
    })
  })

  it('has no deadline for untimed states', () => {
    for (const status of [
      'awaiting_payment',
      'out_for_delivery',
      'released',
      'escalated_admin_review',
    ] as const)
      expect(currentDeadline({ status, updatedAt, deadlines: none })).toBeNull()
  })

  it('counts down on the server clock, not the device clock', () => {
    const deadline = { at: '2026-10-20T10:00:00Z' }
    const device = new Date('2026-10-20T09:50:00Z').getTime()
    // The phone is 5 minutes slow: the server is already at 09:55.
    expect(msLeft(deadline, 5 * 60_000, device)).toBe(5 * 60_000)
    expect(msLeft(deadline, 0, new Date('2026-10-20T11:00:00Z').getTime())).toBe(0)
  })
})
