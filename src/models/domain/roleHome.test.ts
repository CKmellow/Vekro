import { describe, expect, it } from 'vitest'
import { destinationFor, hasStore, homeFor } from './roleHome'

const member = { role: 'buyer' as const, store: { status: 'none' as const } }
const seller = { role: 'seller' as const, store: { status: 'active' as const } }
const closed = { role: 'buyer' as const, store: { status: 'closed' as const } }

describe('destinationFor', () => {
  it('returns to a page the account may use', () => {
    expect(destinationFor(seller, '/seller/orders?segment=held', null)).toBe('/seller/orders?segment=held')
    expect(destinationFor(seller, '/onboarding', null)).toBe('/onboarding')
    expect(destinationFor('admin', '/admin/cases/abc')).toBe('/admin/cases/abc')
    expect(destinationFor(member, '/order/abc', null)).toBe('/order/abc')
    // One account buys and sells: a seller may come back to an order they bought.
    expect(destinationFor(seller, '/order/abc', null)).toBe('/order/abc')
    expect(destinationFor(seller, '/buyer/orders', null)).toBe('/buyer/orders')
    // A closed store still reads its history.
    expect(destinationFor(closed, '/seller/orders', null)).toBe('/seller/orders')
  })

  it('never sends anyone into an area that is not theirs', () => {
    expect(destinationFor(member, '/seller/orders', null)).toBe('/buyer/orders')
    expect(destinationFor(member, '/admin', null)).toBe('/buyer/orders')
    expect(destinationFor(seller, '/admin', null)).toBe('/seller')
    expect(destinationFor('admin', '/seller')).toBe('/admin')
    expect(destinationFor('admin', '/order/abc')).toBe('/admin')
    expect(destinationFor('admin', '/administrator')).toBe('/admin')
  })

  it('ignores missing, off-site and sign-in return URLs', () => {
    expect(destinationFor(seller, null, null)).toBe('/seller')
    expect(destinationFor('admin', 'https://evil.example')).toBe('/admin')
    expect(destinationFor(member, '//evil.example/x', null)).toBe('/buyer/orders')
    expect(destinationFor(member, '/login?returnTo=%2Forder%2Fx', null)).toBe('/buyer/orders')
    expect(destinationFor('admin', '/admin/login')).toBe('/admin')
  })
})

describe('homeFor', () => {
  it('lands an account with a store in its last mode, Selling when none is saved', () => {
    expect(homeFor(seller, null)).toBe('/seller')
    expect(homeFor(seller, 'selling')).toBe('/seller')
    expect(homeFor(seller, 'buying')).toBe('/buyer/orders')
    expect(homeFor(closed, 'buying')).toBe('/buyer/orders')
    expect(homeFor(member, 'selling')).toBe('/buyer/orders')
    expect(homeFor('admin', 'buying')).toBe('/admin')
  })

  it('knows who has a store', () => {
    expect([member, seller, closed].map(hasStore)).toEqual([false, true, true])
    expect(hasStore('seller')).toBe(true)
    expect(hasStore('admin')).toBe(false)
  })
})
