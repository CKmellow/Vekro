import { describe, expect, it } from 'vitest'
import { formatKes } from './money'

describe('formatKes', () => {
  it.each([
    [52000, 'KES 52,000'],
    ['52000.00', 'KES 52,000'],
    ['130.50', 'KES 130.5'],
    [0, 'KES 0'],
    [1250000, 'KES 1,250,000'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatKes(input)).toBe(expected)
  })

  it('rejects values that are not amounts', () => {
    expect(() => formatKes('abc')).toThrow(RangeError)
  })
})
