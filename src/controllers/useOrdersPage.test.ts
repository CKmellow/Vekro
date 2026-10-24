import { describe, expect, it } from 'vitest'
import { toOrderSummary } from '@/models/api/transactions'
import { orderSummaryResponse } from '@/test/fixtures'
import { quickAction, toOrderRow } from './useOrdersPage'

describe('order rows', () => {
  it('offers dispatch only when locked and arrival only when on the way', () => {
    expect(quickAction({ status: 'locked' })?.label).toBe('Dispatch')
    expect(quickAction({ status: 'out_for_delivery' })?.label).toBe('Mark arrived')
    expect(quickAction({ status: 'dispatched' })).toBeNull()
    expect(quickAction({ status: 'hold_24h' })).toBeNull()
  })

  it('maps placed time, the deadline label and the seller status label', () => {
    const row = toOrderRow(toOrderSummary(orderSummaryResponse()), new Date('2026-10-24T11:10:00Z'))
    expect(row).toMatchObject({
      placed: '2 hours ago',
      placedFull: '24 Oct 2026, 12:10',
      status: { label: 'Paid, ready to dispatch', tone: 'emerald' },
      deadline: { kind: 'dispatch', at: '2026-10-26T09:10:00Z', label: 'left to dispatch' },
    })
  })
})
