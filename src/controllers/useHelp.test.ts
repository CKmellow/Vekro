import { describe, expect, it } from 'vitest'
import { HELP } from '@/lib/help'
import { filterHelp } from './useHelp'

describe('filterHelp', () => {
  it('keeps everything for an empty search', () => {
    expect(filterHelp(HELP, '  ')).toBe(HELP)
  })

  it('matches every word in the question or the answer, ignoring case', () => {
    const result = filterHelp(HELP, 'DELIVERY code')
    expect(result.flatMap((s) => s.items.map((i) => i.id))).toEqual(['safe', 'arrives', 'code'])
    expect(result.map((s) => s.title)).toEqual(['Paying', 'Delivery and inspection'])
  })

  it('drops groups with no matching questions', () => {
    expect(filterHelp(HELP, 'refund later zebra')).toEqual([])
  })
})
