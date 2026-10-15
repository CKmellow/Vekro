import { describe, expect, it } from 'vitest'
import { estimatedNetworkFee, payoutBreakdown } from './fees'

describe('fees', () => {
  it('matches the PAGES.md sample and never goes negative', () => {
    expect(payoutBreakdown(52_000)).toEqual({ gross: 52_000, fee: 130, net: 51_870 })
    expect(estimatedNetworkFee(0)).toBe(0)
    expect(estimatedNetworkFee(1_200)).toBe(15)
    expect(payoutBreakdown(10)).toEqual({ gross: 10, fee: 0, net: 10 })
  })
})
