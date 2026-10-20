import { describe, expect, it } from 'vitest'
import { checklist, inspectionVariant } from './useInspection'

describe('B4 variant', () => {
  it.each([
    ['at_door_pending_inspection', false, 'inspect'],
    ['out_for_delivery', false, 'not_yet'],
    ['locked', false, 'not_yet'],
    ['released', false, 'done'],
    ['hold_24h', false, 'hold'],
    ['refunded_buyer', true, 'rejected'],
    ['refunded_buyer', false, 'timed_out'],
    ['disputed_functional', false, 'other'],
  ] as const)('%s (reason stored: %s) is %s', (status, rejected, variant) => {
    expect(inspectionVariant(status, rejected)).toBe(variant)
  })
})

describe('B4 checklist', () => {
  it('shows only the last four digits of the serial number', () => {
    expect(checklist(true, '352098114371234').at(-1)).toBe('Serial number matches ••••1234')
    expect(checklist(false, null)).toHaveLength(3)
    expect(checklist(true, null)).toHaveLength(3)
  })
})

describe('B4 reject reasons', () => {
  it("uses the seller's declared reasons, or the standard set, plus Something else", async () => {
    const { rejectReasons } = await import('./useInspection')
    expect(rejectReasons(['damaged']).map((r) => r.value)).toEqual(['damaged', 'other'])
    expect(rejectReasons([]).map((r) => r.value)).toEqual([
      'damaged',
      'wrong_item',
      'not_as_described',
      'missing_parts',
      'other',
    ])
  })
})
