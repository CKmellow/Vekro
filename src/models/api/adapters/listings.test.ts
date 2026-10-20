import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gapHandlers } from '@/mocks/registry'
import '@/mocks/gaps'
import { listingResponse } from '@/test/fixtures'
import { server } from '@/test/server'
import type { ListingDraft } from '@/models/schemas/listing'
import {
  archiveListing,
  createListing,
  draftFromListing,
  GapUnavailableError,
  getListing,
  listListings,
  toDisputePolicy,
} from './listings'

const mocked = new Set<string>()
vi.mock('./gaps', async (original) => ({
  ...(await original<object>()),
  isMocked: (gap: string) => mocked.has(gap),
}))

const draft: ListingDraft = {
  item: {
    title: 'iPhone 13, 128GB, Midnight',
    category: 'Phones and tablets',
    description: 'Battery 91%',
    price: 52000,
  },
  type: { isSerialized: true, uniqueId: '352098114371234' },
  policy: {
    isSerialized: true,
    doorRejectReasons: [],
    acceptedProblems: ["Won't power on"],
    resolution: 'repair',
  },
}

let posted: Record<string, unknown> | undefined
let uploads: string[]
beforeEach(() => {
  mocked.clear()
  posted = undefined
  uploads = []
  server.use(
    http.post('/api/listings', async ({ request }) => {
      posted = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(
        listingResponse({
          id: 'new-1',
          title: String(posted.title),
          description: String(posted.description),
          category: posted.category as string,
        }),
        { status: 201 },
      )
    }),
    http.post('/api/listings/new-1/photos', ({ request }) => {
      uploads.push(request.headers.get('Content-Type') ?? '')
      if (uploads.length === 2) return HttpResponse.json({ detail: 'Too large.' }, { status: 413 })
      const id = `p${uploads.length}`
      return HttpResponse.json({ id, url: `/listings/new-1/photos/${id}` }, { status: 201 })
    }),
  )
})

describe('listing adapter', () => {
  it('maps the resolution to the seller actions the backend enforces', () => {
    expect(toDisputePolicy(draft.policy)).toEqual({
      accepted_problems: ["Won't power on"],
      resolution: 'repair',
      allowed_seller_actions: ['repair_shipped', 'refund_issued'],
    })
    expect(toDisputePolicy({ ...draft.policy, isSerialized: false, doorRejectReasons: ['damaged'] })).toEqual(
      {
        door_reject_reasons: ['damaged'],
      },
    )
  })

  it('creates with the content fields, then uploads the photos in order', async () => {
    const photos = [
      new Blob(['a'], { type: 'image/jpeg' }),
      new Blob(['b'], { type: 'image/webp' }),
      new Blob(['c'], { type: 'image/jpeg' }),
    ]
    const { listing, photosFailed } = await createListing(draft, photos)
    expect(posted).toMatchObject({
      title: draft.item.title,
      description: 'Battery 91%',
      category: 'Phones and tablets',
      buyer_name: null,
      price: '52000',
      is_serialized: true,
    })
    expect(uploads).toEqual(['image/jpeg', 'image/webp', 'image/jpeg'])
    expect(photosFailed).toBe(1)
    expect(listing).toMatchObject({
      id: 'new-1',
      price: 52000,
      description: 'Battery 91%',
      policy: { resolution: 'repair' },
      photoUrls: ['/api/listings/new-1/photos/p1', '/api/listings/new-1/photos/p3'],
      seller: { name: 'Amina Gadgets', completedSales: 12 },
    })
  })

  it('reads a listing with its status, photos and seller', async () => {
    server.use(
      http.get('/api/listings/l1', () =>
        HttpResponse.json(
          listingResponse({ id: 'l1', status: 'sold', photos: [{ id: 'p', url: '/listings/l1/photos/p' }] }),
        ),
      ),
    )
    expect(await getListing('l1')).toMatchObject({
      status: 'sold',
      photoUrls: ['/api/listings/l1/photos/p'],
      views: null,
      seller: { memberSince: '2026-01-05T00:00:00Z' },
    })
  })

  it('needs the list and archive gaps, and uses their mocks when on', async () => {
    await expect(listListings()).rejects.toBeInstanceOf(GapUnavailableError)
    await expect(archiveListing('x')).rejects.toBeInstanceOf(GapUnavailableError)
    mocked.add('SELLER_LISTS')
    mocked.add('LISTING_UPDATE')
    server.use(...(gapHandlers.SELLER_LISTS ?? []), ...(gapHandlers.LISTING_UPDATE ?? []))
    const active = await listListings({ status: 'active' })
    expect(active.length).toBeGreaterThan(0)
    expect(active.every((l) => l.status === 'active')).toBe(true)
    const archived = await archiveListing(active[0]?.id ?? '')
    expect(archived.status).toBe('archived')
    await expect(archiveListing('7f3c2a10-0001-4b6e-9a1d-000000000001')).rejects.toMatchObject({
      kind: 'conflict',
    })
  })

  it('pre-fills a duplicate without the serial number', async () => {
    mocked.add('SELLER_LISTS')
    server.use(...(gapHandlers.SELLER_LISTS ?? []))
    const source = await getListing('7f3c2a10-0004-4b6e-9a1d-000000000004')
    const copy = draftFromListing(source)
    expect(copy.item).toMatchObject({
      title: 'HP Pavilion 15 laptop',
      category: 'Laptops and computers',
      price: 68500,
    })
    expect(copy.type).toEqual({ isSerialized: true, uniqueId: undefined })
    expect(copy.policy.resolution).toBe('repair')
  })
})
