import { describe, expect, it } from 'vitest'
import { buyerReturnTo, clock } from './useBuyerSignIn'

describe('clock', () => {
  it('rounds up to whole seconds', () => {
    expect(clock(28_100)).toBe('0:29')
    expect(clock(300_000)).toBe('5:00')
    expect(clock(-5)).toBe('0:00')
  })
})

describe('buyerReturnTo', () => {
  it('returns to buyer pages and keeps buyers out of other areas', () => {
    expect(buyerReturnTo('/order/abc')).toBe('/order/abc')
    expect(buyerReturnTo(null)).toBe('/buyer/orders')
    expect(buyerReturnTo('/seller/orders')).toBe('/buyer/orders')
    expect(buyerReturnTo('/admin')).toBe('/buyer/orders')
    expect(buyerReturnTo('https://evil.example')).toBe('/buyer/orders')
  })
})
