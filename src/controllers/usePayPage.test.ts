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

describe('B1 verified sales (#280)', () => {
  it('shows only sales the browser verified, and nothing when there are none', () => {
    const listing = toListing(listingResponse())
    expect(toPayListingView(listing).seller.verified).toBeNull()
    expect(toPayListingView(listing, 0).seller.verified).toBeNull()
    expect(toPayListingView(listing, 1).seller.verified).toBe('1 sale verified on the public record')
    expect(toPayListingView(listing, 9).seller.verified).toBe('9 sales verified on the public record')
  })
})
