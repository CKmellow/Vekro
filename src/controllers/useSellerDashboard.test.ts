import { describe, expect, it } from 'vitest'
import { toOrderSummary } from '@/models/api/transactions'
import type { TransactionStatus } from '@/models/domain/stateMeta'
import { orderSummaryResponse } from '@/test/fixtures'
import { dashboardAction, greeting, monthDelta } from './useSellerDashboard'

const row = (status: TransactionStatus) => toOrderSummary(orderSummaryResponse({ status }))

describe('dashboard actions', () => {
  it('asks for dispatch with the dispatch countdown', () => {
    expect(dashboardAction(row('locked'))).toMatchObject({
      instruction: 'Dispatch VK-7K3P9Q before the timer runs out',
      deadline: { kind: 'dispatch', label: 'Time left to dispatch' },
      button: { label: 'Mark as dispatched', kind: 'dispatch' },
    })
  })

  it('maps arrival, return receipt and resolution', () => {
    expect(dashboardAction(row('out_for_delivery'))?.button).toEqual({
      label: 'Mark as arrived',
      kind: 'mark_arrived',
    })
    expect(dashboardAction(row('return_in_transit'))?.button).toEqual({
      label: 'Confirm received',
      kind: 'open_case',
    })
    expect(dashboardAction(row('return_received'))?.instruction).toBe('Choose a resolution for VK-7K3P9Q')
  })

  it('has nothing for orders that wait on someone else', () => {
    expect(dashboardAction(row('hold_24h'))).toBeNull()
    expect(dashboardAction(row('dispatched'))).toBeNull()
  })
})

describe('dashboard numbers', () => {
  it('compares this month with last month', () => {
    expect(monthDelta(428_000, 382_000)).toEqual({ text: '+12%', up: true })
    expect(monthDelta(300, 400)).toEqual({ text: '-25%', up: false })
    expect(monthDelta(500, 0)).toBeUndefined()
  })

  it('greets by the time in Nairobi', () => {
    expect(greeting(new Date('2026-10-24T05:00:00Z'))).toBe('Good morning')
    expect(greeting(new Date('2026-10-24T10:00:00Z'))).toBe('Good afternoon')
    expect(greeting(new Date('2026-10-24T15:00:00Z'))).toBe('Good evening')
  })
})
