import { describe, expect, it } from 'vitest'
import type { AppNotification } from '@/models/domain/notification'
import { groupByDay, linkFor } from './useNotificationsPage'

const n = (id: string, createdAt: string, extra: Partial<AppNotification> = {}): AppNotification => ({
  id,
  orderId: 'o1',
  event: 'transaction_locked',
  title: id,
  message: '',
  read: false,
  createdAt,
  ...extra,
})

describe('notification groups', () => {
  it('groups by the EAT day and drops empty groups', () => {
    // 24 Oct 01:30 EAT is still 23 Oct in UTC.
    const now = new Date('2026-10-24T09:00:00Z')
    const groups = groupByDay(
      [
        n('a', '2026-10-24T08:00:00Z'),
        n('b', '2026-10-23T22:30:00Z'),
        n('c', '2026-10-23T08:00:00Z'),
        n('d', '2026-10-20T08:00:00Z', { read: true, event: 'admin_decision' }),
      ],
      now,
    )
    expect(groups.map((g) => [g.label, g.rows.map((r) => r.id)])).toEqual([
      ['Today', ['a', 'b']],
      ['Yesterday', ['c']],
      ['Earlier', ['d']],
    ])
    expect(groups[2]?.rows[0]).toMatchObject({ kind: 'support', unread: false })
  })

  it('opens disputes as return cases and everything else as orders', () => {
    expect(linkFor({ event: 'dispute_opened', orderId: 'o1' })).toBe('/seller/returns/o1')
    expect(linkFor({ event: 'delivery_arrived', orderId: 'o1' })).toBe('/seller/orders/o1')
  })
})
