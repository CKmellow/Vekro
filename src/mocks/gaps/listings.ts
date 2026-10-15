// backend-gap #139 (listing content), #7 (seller listing list), #140 (update and archive).
// In-memory only: a page reload resets the store. Delete each block when its gap ships.
import { http, HttpResponse, passthrough } from 'msw'
import type { ListingContent } from '@/models/api/adapters/listings'
import type { Schemas } from '@/models/api/client'
import { gapHandlers } from '../registry'

type ListingResponse = Schemas['ListingResponse']
interface Row {
  listing: ListingResponse
  content: ListingContent
}

const SELLER = '6a0e6b52-8a43-4c35-9c3f-2f0a3b1d7e11'
const at = '2026-10-14T08:00:00Z'
const seed = (
  id: string,
  title: string,
  price: number,
  serialized: boolean,
  status: ListingContent['status'],
  category: string,
  views: number,
): Row => ({
  listing: {
    id,
    seller_id: SELLER,
    title,
    price: price.toFixed(2),
    is_serialized: serialized,
    unique_id: serialized ? '352098114371234' : null,
    dispute_policy: serialized
      ? {
          accepted_problems: ["Won't power on", 'Screen or touch problem', 'Battery drains fast'],
          resolution: 'repair',
          allowed_seller_actions: ['repair_shipped', 'refund_issued'],
        }
      : { door_reject_reasons: ['damaged', 'wrong_item', 'not_as_described'] },
    created_at: at,
    updated_at: at,
  },
  content: { description: '', category, photoUrls: [], buyerName: null, status, views },
})

export const listingStore = new Map<string, Row>(
  [
    seed(
      '7f3c2a10-0001-4b6e-9a1d-000000000001',
      'iPhone 13, 128GB, Midnight',
      52000,
      true,
      'sold',
      'Phones and tablets',
      214,
    ),
    seed(
      '7f3c2a10-0002-4b6e-9a1d-000000000002',
      'Nike Air Force 1, size 42',
      6500,
      false,
      'active',
      'Shoes',
      96,
    ),
    seed('7f3c2a10-0003-4b6e-9a1d-000000000003', 'Kitenge wrap dress', 3200, false, 'active', 'Fashion', 58),
    seed(
      '7f3c2a10-0004-4b6e-9a1d-000000000004',
      'HP Pavilion 15 laptop',
      68500,
      true,
      'active',
      'Laptops and computers',
      131,
    ),
    seed(
      '7f3c2a10-0005-4b6e-9a1d-000000000005',
      '3-seater sofa',
      38000,
      false,
      'awaiting_payment',
      'Home and furniture',
      44,
    ),
    seed('7f3c2a10-0006-4b6e-9a1d-000000000006', 'Leather sandals', 2800, false, 'draft', 'Shoes', 0),
  ].map((row) => [row.listing.id, row]),
)

const notFound = () => HttpResponse.json({ detail: 'Listing not found.' }, { status: 404 })
const now = () => new Date().toISOString()

gapHandlers.LISTING_CONTENT = [
  // Seeded listings exist only here; every other id goes to the real API.
  http.get('/api/listings/:id', ({ params }) => {
    const row = listingStore.get(String(params.id))
    return row ? HttpResponse.json(row.listing) : passthrough()
  }),
  http.get('/api/__gaps__/listings/:id/content', ({ params }) => {
    const row = listingStore.get(String(params.id))
    return row ? HttpResponse.json(row.content) : notFound()
  }),
  http.put('/api/__gaps__/listings/:id/content', async ({ params, request }) => {
    const body = (await request.json()) as Partial<ListingContent> & { snapshot: ListingResponse }
    const content: ListingContent = {
      description: body.description ?? '',
      category: body.category ?? null,
      photoUrls: body.photoUrls ?? [],
      buyerName: body.buyerName ?? null,
      status: 'active',
      views: 0,
    }
    listingStore.set(String(params.id), { listing: body.snapshot, content })
    return HttpResponse.json(content)
  }),
]

gapHandlers.SELLER_LISTS = [
  http.get('/api/__gaps__/seller/listings', ({ request }) => {
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const q = url.searchParams.get('q')?.toLowerCase().trim()
    const rows = [...listingStore.values()]
      .filter((row) => !status || row.content.status === status)
      .filter((row) => !q || row.listing.title.toLowerCase().includes(q))
      .sort((a, b) => b.listing.created_at.localeCompare(a.listing.created_at))
    return HttpResponse.json(rows)
  }),
]

const locked = (row: Row) => row.content.status === 'sold' || row.content.status === 'awaiting_payment'

gapHandlers.LISTING_UPDATE = [
  http.patch('/api/__gaps__/listings/:id', async ({ params, request }) => {
    const row = listingStore.get(String(params.id))
    if (!row) return notFound()
    if (locked(row)) return HttpResponse.json({ detail: 'This listing has a paid order.' }, { status: 409 })
    const body = (await request.json()) as Record<string, unknown>
    const next: Row = {
      listing: {
        ...row.listing,
        title: String(body.title ?? row.listing.title),
        price: String(body.price ?? row.listing.price),
        is_serialized: Boolean(body.is_serialized ?? row.listing.is_serialized),
        unique_id: (body.unique_id as string | null | undefined) ?? row.listing.unique_id,
        dispute_policy:
          (body.dispute_policy as Record<string, unknown> | undefined) ?? row.listing.dispute_policy,
        updated_at: now(),
      },
      content: {
        ...row.content,
        description: String(body.description ?? row.content.description),
        category: (body.category as string | null | undefined) ?? row.content.category,
        buyerName: (body.buyerName as string | null | undefined) ?? row.content.buyerName,
      },
    }
    listingStore.set(row.listing.id, next)
    return HttpResponse.json(next)
  }),
  http.post('/api/__gaps__/listings/:id/archive', ({ params }) => {
    const row = listingStore.get(String(params.id))
    if (!row) return notFound()
    if (locked(row)) return HttpResponse.json({ detail: 'This listing has a paid order.' }, { status: 409 })
    const next = {
      listing: { ...row.listing, updated_at: now() },
      content: { ...row.content, status: 'archived' as const },
    }
    listingStore.set(row.listing.id, next)
    return HttpResponse.json(next)
  }),
]
