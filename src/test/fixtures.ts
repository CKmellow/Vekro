import type { Schemas } from '@/models/api/client'

/** A `ListingResponse` with PAGES.md 0.1 sample data (Amina Gadgets' iPhone 13). */
export const listingResponse = (
  overrides: Partial<Schemas['ListingResponse']> = {},
): Schemas['ListingResponse'] => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  seller_id: '6a0e6b52-8a43-4c35-9c3f-2f0a3b1d7e11',
  title: 'iPhone 13, 128GB, Midnight',
  description: 'Battery health 91%. Comes with the original box and a cable.',
  category: 'Phones and tablets',
  buyer_name: null,
  price: '52000.00',
  is_serialized: true,
  unique_id: '352098114371234',
  dispute_policy: {
    accepted_problems: ["Won't power on", 'Screen or touch problem'],
    resolution: 'repair',
    allowed_seller_actions: ['repair_shipped', 'refund_issued'],
  },
  status: 'active',
  photos: [],
  seller: { name: 'Amina Gadgets', member_since: '2026-01-05T00:00:00Z', completed_sales: 12 },
  created_at: '2026-10-15T09:00:00Z',
  updated_at: '2026-10-15T09:00:00Z',
  ...overrides,
})
