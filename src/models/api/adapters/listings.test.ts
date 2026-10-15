import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gapHandlers } from '@/mocks/registry'
import '@/mocks/gaps'
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
beforeEach(() => {
  mocked.clear()
  posted = undefined
  URL.createObjectURL = vi.fn(() => 'blob:photo')
  server.use(
    http.post('/api/listings', async ({ request }) => {
      posted = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(
        {
          id: 'new-1',
          seller_id: 's1',
          title: posted.title,
          price: '52000.00',
          is_serialized: posted.is_serialized,
          unique_id: posted.unique_id,
          dispute_policy: posted.dispute_policy,
          created_at: '2026-10-15T09:00:00Z',
          updated_at: '2026-10-15T09:00:00Z',
        },
        { status: 201 },
      )
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

  it('creates through POST /listings and says when content could not be saved', async () => {
    const { listing, contentSaved } = await createListing(draft, [new Blob(['x'])])
    expect(posted).toMatchObject({ title: draft.item.title, price: '52000', is_serialized: true })
    expect(listing).toMatchObject({
      id: 'new-1',
      price: 52000,
      policy: { resolution: 'repair' },
      photoUrls: [],
    })
    expect(contentSaved).toBe(false)
  })

  it('saves content through the gap mock when its flag is on, and reads it back', async () => {
    mocked.add('LISTING_CONTENT')
    server.use(...(gapHandlers.LISTING_CONTENT ?? []))
    const { listing, contentSaved } = await createListing(draft, [new Blob(['x'])])
    expect(contentSaved).toBe(true)
    expect(listing).toMatchObject({
      description: 'Battery 91%',
      category: 'Phones and tablets',
      photoUrls: ['blob:photo'],
    })
    server.use(
      http.get('/api/listings/new-1', () =>
        HttpResponse.json({
          ...posted,
          id: 'new-1',
          seller_id: 's1',
          price: '52000.00',
          created_at: '',
          updated_at: '',
        }),
      ),
    )
    expect((await getListing('new-1')).description).toBe('Battery 91%')
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
    mocked.add('LISTING_CONTENT')
    server.use(...(gapHandlers.LISTING_CONTENT ?? []))
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
