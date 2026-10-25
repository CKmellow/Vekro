import { describe, expect, it } from 'vitest'
import { toOrder } from '@/models/api/transactions'
import { orderResponse } from '@/test/fixtures'
import { toEntries, upcomingSteps } from './useOrderTimeline'

const NOW = new Date('2026-10-20T12:00:00Z')

describe('B7 entries', () => {
  it('puts the newest first with an actor per event kind', () => {
    const entries = toEntries(
      [
        {
          kind: 'transaction_created',
          at: '2026-10-20T06:03:00Z',
          title: 'Order created',
          description: 'Waiting for your payment.',
        },
        {
          kind: 'transaction_locked',
          at: '2026-10-20T06:05:00Z',
          title: 'Paid into the vault',
          description: 'Vekro holds your money.',
        },
        {
          kind: 'transaction_dispatched',
          at: '2026-10-20T08:20:00Z',
          title: 'On the way',
          description: 'The seller sent your item.',
        },
      ],
      NOW,
    )
    expect(entries.map((e) => [e.text, e.actor, e.time])).toEqual([
      ['On the way', 'seller', 'Today 11:20'],
      ['Paid into the vault', 'vekro', 'Today 09:05'],
      ['Order created', 'you', 'Today 09:03'],
    ])
    expect(entries[0]?.detail).toBe('The seller sent your item.')
  })

  it('names unknown kinds as Vekro', () => {
    expect(
      toEntries([{ kind: 'something_new', at: '2026-10-20T06:00:00Z', title: 'x', description: 'y' }], NOW)[0]
        ?.actor,
    ).toBe('vekro')
  })
})

describe('B7 upcoming steps', () => {
  it('shows the next step with its server deadline, dashed', () => {
    const order = toOrder(
      orderResponse({ status: 'locked', deadlines: { dispatch_by: '2026-10-22T09:00:00Z' } }),
    )
    expect(upcomingSteps(order, NOW)).toEqual([
      {
        id: 'next-The seller dispatches your order, or you are refunded',
        text: 'The seller dispatches your order, or you are refunded',
        time: 'By 22 Oct 12:00',
        upcoming: true,
      },
    ])
  })

  it('has nothing upcoming once the order is finished', () => {
    expect(upcomingSteps(toOrder(orderResponse({ status: 'released' })), NOW)).toEqual([])
  })
})

describe('seller timeline', () => {
  it('names the seller "You" and the buyer "Buyer"', () => {
    const entries = toEntries(
      [
        {
          kind: 'transaction_dispatched',
          at: '2026-10-20T06:00:00Z',
          title: 'You sent the item.',
          description: '',
        },
        { kind: 'otp_given', at: '2026-10-20T07:00:00Z', title: 'The buyer accepted.', description: '' },
      ],
      NOW,
      'seller',
    )
    expect(entries.map((e) => e.actor)).toEqual(['buyer', 'you'])
  })

  it('words the next step for the seller', () => {
    const order = toOrder(orderResponse({ status: 'locked', viewer_role: 'seller' }))
    expect(upcomingSteps(order, NOW)[0]?.text).toBe('Dispatch the order, or the buyer is refunded')
  })
})

describe('admin timeline', () => {
  it('names both parties for support', () => {
    const entries = toEntries(
      [
        { kind: 'transaction_dispatched', at: '2026-10-20T06:00:00Z', title: 'Dispatched', description: '' },
        { kind: 'otp_given', at: '2026-10-20T07:00:00Z', title: 'Accepted', description: '' },
      ],
      NOW,
      'admin',
    )
    expect(entries.map((e) => e.actor)).toEqual(['buyer', 'seller'])
  })
})
