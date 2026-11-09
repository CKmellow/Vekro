import { describe, expect, it } from 'vitest'
import { destinationFor } from './roleHome'

describe('destinationFor', () => {
  it("returns to a page in the person's own area", () => {
    expect(destinationFor('seller', '/seller/orders?segment=held')).toBe('/seller/orders?segment=held')
    expect(destinationFor('seller', '/onboarding')).toBe('/onboarding')
    expect(destinationFor('admin', '/admin/cases/abc')).toBe('/admin/cases/abc')
    expect(destinationFor('buyer', '/order/abc')).toBe('/order/abc')
  })

  it("sends everyone else to their own home, never into another role's area", () => {
    expect(destinationFor('buyer', '/seller/orders')).toBe('/buyer/orders')
    expect(destinationFor('buyer', '/admin')).toBe('/buyer/orders')
    expect(destinationFor('seller', '/admin')).toBe('/seller')
    expect(destinationFor('seller', '/order/abc')).toBe('/seller')
    expect(destinationFor('admin', '/seller')).toBe('/admin')
    expect(destinationFor('admin', '/administrator')).toBe('/admin')
  })

  it('ignores missing, off-site and sign-in return URLs', () => {
    expect(destinationFor('seller', null)).toBe('/seller')
    expect(destinationFor('admin', 'https://evil.example')).toBe('/admin')
    expect(destinationFor('buyer', '//evil.example/x')).toBe('/buyer/orders')
    expect(destinationFor('buyer', '/login?returnTo=%2Forder%2Fx')).toBe('/buyer/orders')
    expect(destinationFor('admin', '/admin/login')).toBe('/admin')
  })
})
