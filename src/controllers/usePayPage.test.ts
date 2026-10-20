import { describe, expect, it } from 'vitest'
import { toListing } from '@/models/api/adapters/listings'
import { listingResponse } from '@/test/fixtures'
import { initials, toPayListingView } from './usePayPage'

describe('B1 view mapping', () => {
  it('makes initials from one or two words', () => {
    expect(initials('Amina Gadgets')).toBe('AG')
    expect(initials('  kamau  ')).toBe('KA')
  })

  it('names a refund-only resolution once', () => {
    const view = toPayListingView(toListing(listingResponse({ dispute_policy: { resolution: 'refund' } })))
    expect(view.promise.title).toBe('Seller offers: Refund')
  })

  it('uses singular "sale" and keeps a private link name', () => {
    const view = toPayListingView(
      toListing(
        listingResponse({
          buyer_name: 'Wanjiku',
          seller: { name: 'Amina Gadgets', member_since: '2026-01-05T00:00:00Z', completed_sales: 1 },
        }),
      ),
    )
    expect(view.seller.meta).toBe('1 sale · On Vekro since Jan 2026')
    expect(view.reservedFor).toBe('Wanjiku')
  })

  it('maps listing status to availability', () => {
    const at = (status: 'active' | 'sold' | 'archived' | 'awaiting_payment') =>
      toPayListingView({ ...toListing(listingResponse()), status }).availability
    expect(at('active')).toBe('open')
    expect(at('awaiting_payment')).toBe('open')
    expect(at('sold')).toBe('sold')
    expect(at('archived')).toBe('withdrawn')
  })
})
