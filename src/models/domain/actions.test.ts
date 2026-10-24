import { describe, expect, it } from 'vitest'
import { getAvailableActions, type OrderAction } from './actions'
import { STATE_META, type TransactionStatus, type ViewerRole } from './stateMeta'

const ALL = Object.keys(STATE_META) as TransactionStatus[]

const EXPECTED: Record<TransactionStatus, Record<ViewerRole, OrderAction[]>> = {
  initiated: { buyer: ['pay'], seller: [], admin: [] },
  awaiting_payment: { buyer: ['pay'], seller: [], admin: [] },
  locked: { buyer: [], seller: ['dispatch'], admin: [] },
  out_for_delivery: { buyer: [], seller: ['mark_arrived'], admin: [] },
  dispatched: { buyer: [], seller: [], admin: [] },
  at_door_pending_inspection: { buyer: ['accept_with_code', 'reject_at_door'], seller: [], admin: [] },
  hold_24h: { buyer: ['report_problem'], seller: [], admin: [] },
  disputed_functional: { buyer: ['mark_sent_back'], seller: [], admin: [] },
  return_in_transit: { buyer: [], seller: ['confirm_return_received'], admin: [] },
  return_received: { buyer: [], seller: ['choose_resolution'], admin: [] },
  awaiting_buyer_reconfirmation: { buyer: ['reconfirm'], seller: [], admin: [] },
  escalated_admin_review: { buyer: [], seller: [], admin: [] },
  returned_to_seller: { buyer: [], seller: [], admin: [] },
  refunded_buyer: { buyer: [], seller: [], admin: [] },
  released: { buyer: [], seller: [], admin: [] },
  resolved_refund: { buyer: [], seller: [], admin: [] },
  resolved_release: { buyer: [], seller: [], admin: [] },
  resolved_split: { buyer: [], seller: [], admin: [] },
}

describe('getAvailableActions', () => {
  it('covers every backend status', () => {
    expect(Object.keys(EXPECTED).sort()).toEqual([...ALL].sort())
  })

  const cases = ALL.flatMap((status) =>
    (['buyer', 'seller', 'admin'] as const).map((role) => [status, role, EXPECTED[status][role]] as const),
  )
  it.each(cases)('%s as %s', (status, role, actions) => {
    expect(getAvailableActions(role, { status })).toEqual(actions)
  })

  it('offers nothing for final states', () => {
    for (const status of ALL.filter((s) => STATE_META[s].final))
      for (const role of ['buyer', 'seller', 'admin'] as const)
        expect(getAvailableActions(role, { status })).toEqual([])
  })
})

describe('confirm resolved', () => {
  const dispute = (buyer: boolean, seller: boolean) => ({
    id: 'd1',
    status: 'resolved_release',
    category: 'not_working',
    description: 'x',
    openedAt: '2026-10-20T09:00:00Z',
    escalatedAt: null,
    resolvedAt: null,
    sellerAction: null,
    sellerNotes: null,
    buyerNotes: null,
    reconfirmRejections: 0,
    buyerConfirmedResolved: buyer,
    sellerConfirmedResolved: seller,
  })

  it.each(['resolved_release', 'resolved_refund', 'resolved_split'] as const)(
    'offers closure on %s to each side until it confirms',
    (status) => {
      expect(getAvailableActions('buyer', { status, dispute: dispute(false, true) })).toEqual([
        'confirm_resolved',
      ])
      expect(getAvailableActions('seller', { status, dispute: dispute(false, true) })).toEqual([])
      expect(getAvailableActions('admin', { status, dispute: dispute(false, false) })).toEqual([])
    },
  )

  it('never offers closure without a dispute or before the case is resolved', () => {
    expect(getAvailableActions('buyer', { status: 'resolved_release', dispute: null })).toEqual([])
    expect(
      getAvailableActions('buyer', { status: 'refunded_buyer', dispute: dispute(false, false) }),
    ).toEqual([])
  })
})
