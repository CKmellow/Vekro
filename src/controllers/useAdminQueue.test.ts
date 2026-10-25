import { describe, expect, it } from 'vitest'
import { caseAge, decisionTime } from '@/models/domain/adminCase'
import { shortCaseId, toQueueRow } from './useAdminQueue'

const NOW = new Date('2026-10-25T12:00:00Z').getTime()
const ago = (hours: number) => new Date(NOW - hours * 3_600_000).toISOString()

describe('queue rows', () => {
  it('ages cases from escalation: sand, then saffron at 12h, coral at 24h', () => {
    expect(caseAge(ago(0.25), NOW)).toMatchObject({ tone: 'sand', label: '15m' })
    expect(caseAge(ago(13), NOW)).toMatchObject({ tone: 'saffron', label: '13h' })
    expect(caseAge(ago(30), NOW)).toMatchObject({ tone: 'coral', label: '30h' })
    expect(caseAge(ago(72), NOW)).toMatchObject({ tone: 'coral', label: '3d' })
  })

  it('names who disagreed and shortens the case id', () => {
    const row = toQueueRow(
      {
        disputeId: '7a3f9c2e-1b4d-4e8f-9a0b-1c2d3e4f5a6b',
        transactionId: 't',
        reference: 'VK-7K3P9Q',
        amount: 52000,
        itemTitle: 'iPhone',
        buyerName: 'Brian',
        sellerName: 'Amina',
        category: 'not_working',
        trigger: 'party_escalated',
        escalatedBy: 'seller',
        decision: null,
        openedAt: ago(48),
        escalatedAt: ago(2),
        resolvedAt: null,
      },
      NOW,
    )
    expect(row).toMatchObject({
      caseId: 'D-7A3F',
      trigger: 'Seller disagrees',
      category: "Doesn't work properly",
    })
    expect(shortCaseId('00ab-cd')).toBe('D-00AB')
  })

  it('formats the average time to decide', () => {
    expect(decisionTime(19_200)).toBe('5h 20m')
    expect(decisionTime(600)).toBe('10m')
    expect(decisionTime(null)).toBeNull()
  })
})
