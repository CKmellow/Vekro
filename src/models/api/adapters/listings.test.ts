import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import type { ListingDraft } from '@/models/schemas/listing'
import { server } from '@/test/server'
import { createListing, draftFromListing, getListing, toDisputePolicy } from './listings'

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

const response = (body: Record<string, unknown>) => ({
  id: 'new-1',
  seller_id: 's1',
  price: '52000.00',
  created_at: '2026-10-15T09:00:00Z',
  updated_at: '2026-10-15T09:00:00Z',
  ...body,
})

let posted: Record<string, unknown> | undefined
beforeEach(() => {
  posted = undefined
  server.use(
    http.post('/api/listings', async ({ request }) => {
      posted = (await request.json()) as Record<string, unknown>
      return HttpResponse.json(response(posted), { status: 201 })
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

  it('creates through POST /listings and reads the policy back', async () => {
    const listing = await createListing(draft)
    expect(posted).toMatchObject({
      title: draft.item.title,
      price: '52000',
      is_serialized: true,
      unique_id: '352098114371234',
    })
    expect(listing).toMatchObject({
      id: 'new-1',
      price: 52000,
      policy: { resolution: 'repair' },
      photoUrls: [],
    })
  })

  it('sends no serial number for standard items', async () => {
    await createListing({
      ...draft,
      type: { isSerialized: false, uniqueId: 'left over' },
      policy: { isSerialized: false, doorRejectReasons: ['damaged'], acceptedProblems: [] },
    })
    expect(posted).toMatchObject({ is_serialized: false, unique_id: null })
  })

  it('pre-fills a duplicate without the serial number', async () => {
    server.use(
      http.get('/api/listings/:id', () =>
        HttpResponse.json(
          response({
            id: 'l4',
            title: 'HP Pavilion 15 laptop',
            price: '68500.00',
            is_serialized: true,
            unique_id: '5CD1234XYZ',
            dispute_policy: { accepted_problems: ['Overheating'], resolution: 'replacement' },
          }),
        ),
      ),
    )
    const copy = draftFromListing(await getListing('l4'))
    expect(copy.item).toMatchObject({ title: 'HP Pavilion 15 laptop', category: 'Other', price: 68500 })
    expect(copy.type).toEqual({ isSerialized: true, uniqueId: undefined })
    expect(copy.policy).toMatchObject({ resolution: 'replacement', acceptedProblems: ['Overheating'] })
  })
})
