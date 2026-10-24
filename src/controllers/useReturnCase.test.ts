import { describe, expect, it } from 'vitest'
import { toOrder } from '@/models/api/transactions'
import { sellerOptions } from '@/models/domain/listing'
import { disputeResponse, sellerOrderResponse } from '@/test/fixtures'
import { casePanel } from './useReturnCase'

describe('seller options', () => {
  it('uses the declared actions, else the resolution, else all three', () => {
    expect(sellerOptions({ allowedActions: ['repair_shipped', 'refund_issued'] })).toEqual([
      'refund_issued',
      'repair_shipped',
    ])
    expect(sellerOptions({ resolution: 'replacement' })).toEqual(['refund_issued', 'replacement_shipped'])
    expect(sellerOptions({})).toEqual(['refund_issued', 'repair_shipped', 'replacement_shipped'])
  })
})

describe('case panels', () => {
  it('asks the seller to confirm receipt, with the receipt countdown', () => {
    const order = toOrder(
      sellerOrderResponse({
        status: 'return_in_transit',
        dispute: disputeResponse(),
        deadlines: {
          ...sellerOrderResponse().deadlines,
          dispatch_by: null,
          return_confirm_by: '2026-10-27T09:00:00Z',
        },
      }),
    )
    expect(casePanel(order)).toMatchObject({
      title: 'Waiting for the item to arrive',
      deadline: { kind: 'return_confirm', label: 'Time left to confirm receipt' },
    })
  })

  it("shows the seller's chosen fix while the buyer checks it", () => {
    const order = toOrder(
      sellerOrderResponse({
        status: 'awaiting_buyer_reconfirmation',
        dispute: disputeResponse({ seller_action: 'replacement_shipped', seller_notes: 'New unit via G4S.' }),
      }),
    )
    expect(casePanel(order)).toMatchObject({ body: 'You sent a replacement', quote: 'New unit via G4S.' })
  })
})
