// backend-gap #144 (seller profile and payout settings). In-memory; delete when the gap ships.
import { http, HttpResponse } from 'msw'
import type { SellerProfileInput } from '@/models/api/adapters/sellerProfile'
import { gapHandlers } from '../registry'

export let sellerProfile: SellerProfileInput | null = null

gapHandlers.SELLER_PROFILE = [
  http.get('/api/__gaps__/seller/profile', () => HttpResponse.json(sellerProfile)),
  http.put('/api/__gaps__/seller/profile', async ({ request }) => {
    sellerProfile = (await request.json()) as SellerProfileInput
    return HttpResponse.json(sellerProfile)
  }),
]
