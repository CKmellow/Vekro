import { describe, expect, it } from 'vitest'
import { toOrder } from '@/models/api/transactions'
import { STATE_META, type TransactionStatus } from '@/models/domain/stateMeta'
import { orderResponse } from '@/test/fixtures'
import { moneyAt, nextStep, progress } from './useOrderTracker'

const order = (status: TransactionStatus, overrides: Parameters<typeof orderResponse>[0] = {}) =>
  toOrder(orderResponse({ status, ...overrides }))
const ALL = Object.keys(STATE_META) as TransactionStatus[]

describe('B3 mappings', () => {
  it.each(ALL)('%s has a next step that never shows a raw status name', (status) => {
    const step = nextStep(order(status))
    expect(step.title.length).toBeGreaterThan(3)
    expect(`${step.title} ${step.body}`).not.toContain(status)
  })

  it('only timed states carry a countdown, from the server deadline', () => {
    const locked = nextStep(order('locked', { deadlines: { dispatch_by: '2026-10-22T09:00:00Z' } }))
    expect(locked.deadline).toMatchObject({
      kind: 'dispatch',
      at: '2026-10-22T09:00:00Z',
      approximate: false,
    })
    expect(nextStep(order('out_for_delivery')).deadline).toBeNull()
  })

  it('says where the refund goes, masked', () => {
    expect(nextStep(order('refunded_buyer')).body).toBe(
      'KES 52,000 is going back to +254 712 *** 678 by M-Pesa.',
    )
  })

  it.each([
    ['awaiting_payment', 'buyer'],
    ['locked', 'vault'],
    ['hold_24h', 'vault'],
    ['released', 'seller'],
    ['resolved_release', 'seller'],
    ['refunded_buyer', 'buyer'],
    ['returned_to_seller', 'buyer'],
    ['resolved_split', 'vault'],
  ] as const)('money for %s is with the %s', (status, at) => {
    expect(moneyAt(status)).toBe(at)
  })

  it('adds the 24-hour hold step for serial-numbered items', () => {
    expect(progress(order('hold_24h'))).toEqual({
      steps: ['Paid', 'On the way', 'At your door', 'Inspected', 'Held 24h', 'Complete'],
      current: 4,
    })
    const standard = order('at_door_pending_inspection', {
      listing: { ...orderResponse().listing, is_serialized: false },
    })
    expect(progress(standard)).toEqual({
      steps: ['Paid', 'On the way', 'At your door', 'Inspected', 'Complete'],
      current: 2,
    })
    expect(progress(order('released'))?.current).toBe(6)
    expect(progress(order('refunded_buyer'))).toBeNull()
  })
})
