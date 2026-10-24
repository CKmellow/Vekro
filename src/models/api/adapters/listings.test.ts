import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { listingListResponse, listingResponse } from '@/test/fixtures'
import { server } from '@/test/server'
import type { ListingDraft } from '@/models/schemas/listing'
import {
  archiveListing,
  createListing,
  draftFromListing,
  getListing,
  listListings,
  restoreListing,
  updateListing,
  toDisputePolicy,
} from './listings'

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

  it('lists the seller listings with the filter and the server counts', async () => {
    let url = new URL('http://x')
    server.use(
      http.get('/api/listings', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(listingListResponse([listingResponse({ id: 'l1' })]))
      }),
    )
    const page = await listListings({ status: 'active', q: ' iphone ' })
    expect(Object.fromEntries(url.searchParams)).toEqual({ status: 'active', q: 'iphone', page_size: '100' })
    expect(page).toMatchObject({ total: 1, counts: { active: 1, sold: 0, archived: 0 } })
    expect(page.listings[0]?.id).toBe('l1')
  })

  it('updates, archives and restores on the real endpoints', async () => {
    let patched: Record<string, unknown> | undefined
    server.use(
      http.patch('/api/listings/l1', async ({ request }) => {
        patched = (await request.json()) as Record<string, unknown>
        return HttpResponse.json(listingResponse({ id: 'l1', title: String(patched.title) }))
      }),
      http.post('/api/listings/l1/archive', () =>
        HttpResponse.json(listingResponse({ id: 'l1', status: 'archived' })),
      ),
      http.post('/api/listings/l1/restore', () => HttpResponse.json(listingResponse({ id: 'l1' }))),
      http.post('/api/listings/sold/archive', () =>
        HttpResponse.json({ detail: 'This listing has a paid order.' }, { status: 409 }),
      ),
    )
    expect((await updateListing('l1', draft)).title).toBe('iPhone 13, 128GB, Midnight')
    expect(patched).toMatchObject({ price: '52000', unique_id: '352098114371234', buyer_name: null })
    expect((await archiveListing('l1')).status).toBe('archived')
    expect((await restoreListing('l1')).status).toBe('active')
    await expect(archiveListing('sold')).rejects.toMatchObject({ kind: 'conflict' })
  })

  it('pre-fills a duplicate without the serial number', async () => {
    server.use(
      http.get('/api/listings/hp', () =>
        HttpResponse.json(
          listingResponse({
            id: 'hp',
            title: 'HP Pavilion 15 laptop',
            category: 'Laptops and computers',
            price: '68500.00',
          }),
        ),
      ),
    )
    const source = await getListing('hp')
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
