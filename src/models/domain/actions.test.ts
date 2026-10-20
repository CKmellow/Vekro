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
