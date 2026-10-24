import { describe, expect, it } from 'vitest'
import { toOrder } from '@/models/api/transactions'
import type { TransactionStatus } from '@/models/domain/stateMeta'
import { disputeResponse, orderResponse } from '@/test/fixtures'
import { returnPanel, returnStep } from './useReturnFlow'

const at = (status: TransactionStatus, dispute = disputeResponse()) =>
  toOrder(orderResponse({ status, dispute }))

describe('return panels', () => {
  it('asks the buyer to send it back, with the send-by countdown', () => {
    const order = toOrder(
      orderResponse({
        status: 'disputed_functional',
        deadlines: { ...orderResponse().deadlines, return_send_by: '2026-10-24T11:00:00Z' },
      }),
    )
    expect(returnPanel(order)).toMatchObject({
      tone: 'coral',
      title: 'Send the item back',
      deadline: { kind: 'return_send', label: 'Time left to send it back' },
    })
  })

  it("shows the seller's chosen action and note when asking if it's fixed", () => {
    expect(
      returnPanel(
        at(
          'awaiting_buyer_reconfirmation',
          disputeResponse({ seller_action: 'repair_shipped', seller_notes: 'New screen.' }),
        ),
      ),
    ).toMatchObject({
      tone: 'saffron',
      title: 'Is it fixed?',
      body: 'The seller sent a repair',
      quote: 'New screen.',
    })
  })

  it('celebrates a refund with the amount and the masked number', () => {
    expect(returnPanel(at('refunded_buyer'))).toMatchObject({
      tone: 'emerald',
      title: 'Refund issued: KES 52,000',
      body: "It's going back to +254 712 *** 678 by M-Pesa.",
    })
  })

  it('maps statuses onto the four steps', () => {
    expect(
      (['disputed_functional', 'return_in_transit', 'return_received', 'resolved_release'] as const).map(
        returnStep,
      ),
    ).toEqual([0, 1, 2, 4])
  })
})
