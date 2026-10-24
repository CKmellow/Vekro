import { describe, expect, it } from 'vitest'
import { toOrder } from '@/models/api/transactions'
import type { TransactionStatus } from '@/models/domain/stateMeta'
import { disputeResponse, sellerOrderResponse } from '@/test/fixtures'
import { actionPanel, payoutLine } from './useSellerOrder'

const at = (status: TransactionStatus, extra = {}) => toOrder(sellerOrderResponse({ status, ...extra }))

describe('S6 action panel', () => {
  it('asks to dispatch a paid order, with the deadline and the refund warning', () => {
    expect(actionPanel(at('locked'))).toMatchObject({
      tone: 'emerald',
      title: 'Ready to dispatch',
      warning: "If you don't dispatch in time, the buyer is refunded automatically.",
      deadline: { kind: 'dispatch', at: '2026-10-22T09:00:00Z', label: 'Time left to dispatch' },
      action: { kind: 'dispatch', label: 'Mark as dispatched' },
    })
  })

  it('offers arrival on the way, but nothing for legacy dispatched', () => {
    expect(actionPanel(at('out_for_delivery')).action).toEqual({
      kind: 'mark_arrived',
      label: 'Mark item arrived',
    })
    expect(actionPanel(at('dispatched')).action).toBeNull()
  })

  it.each<[TransactionStatus, string]>([
    ['awaiting_payment', 'Waiting for the buyer to pay'],
    ['at_door_pending_inspection', 'The buyer is inspecting'],
    ['hold_24h', 'Funds held for 24 hours'],
    ['released', "You've been paid"],
    ['resolved_split', 'Settled by Vekro support'],
  ])('%s has no action: "%s"', (status, title) => {
    const panel = actionPanel(at(status))
    expect(panel.title).toBe(title)
    expect(panel.action).toBeNull()
  })

  it('sends dispute states to the return case; secondary once escalated', () => {
    expect(actionPanel(at('return_received')).action).toEqual({
      kind: 'open_case',
      label: 'Open return case',
      to: `/seller/returns/${sellerOrderResponse().id}`,
    })
    expect(actionPanel(at('escalated_admin_review')).action).toMatchObject({ secondary: true })
  })

  it("quotes the buyer's door rejection on a refunded order", () => {
    const panel = actionPanel(
      at('refunded_buyer', { door_rejection: { reason: 'not_as_described', note: 'Screen has a crack.' } }),
    )
    expect(panel.body).toBe(
      'The buyer was refunded. Buyer\'s reason: Not as described. "Screen has a crack."',
    )
  })
})

describe('S6 payout line', () => {
  it('shows the M-Pesa reference once paid out', () => {
    expect(
      payoutLine({
        status: 'paid_out',
        amount: 52000,
        reference: 'QJK7ZX12AB',
        paidAt: '2026-10-24T11:36:00Z',
      }),
    ).toEqual({
      tone: 'emerald',
      icon: 'check',
      text: 'Paid out to M-Pesa',
      reference: 'QJK7ZX12AB',
      when: '24 Oct 2026, 14:36',
    })
  })

  it.each([
    ['held', 'Held until the buyer accepts'],
    ['in_progress', 'Payout in progress'],
    ['delayed', "Payout delayed. We're retrying."],
    ['refunded', 'Refunded to the buyer'],
    ['not_paid', 'Waiting for the buyer to pay'],
  ] as const)('%s reads "%s"', (status, text) => {
    expect(payoutLine({ status, amount: null, reference: null, paidAt: null }).text).toBe(text)
  })
})

describe('closing a resolved case', () => {
  it('links the seller to the case until they confirm', () => {
    expect(actionPanel(at('resolved_release', { dispute: disputeResponse() })).action).toEqual({
      kind: 'open_case',
      label: 'Close the case',
      to: `/seller/returns/${sellerOrderResponse().id}`,
      secondary: true,
    })
    expect(
      actionPanel(at('resolved_release', { dispute: disputeResponse({ seller_confirmed_resolved: true }) }))
        .action,
    ).toBeNull()
    expect(actionPanel(at('released')).action).toBeNull()
  })
})
