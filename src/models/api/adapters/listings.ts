import {
  allowedSellerActions,
  CATEGORIES,
  type DisputePolicy,
  type Listing,
  type ListingStatus,
} from '@/models/domain/listing'
import type { ListingDraft } from '@/models/schemas/listing'
import { api, gapRequest, type Schemas } from '../client'
import { isMocked, type Gap } from './gaps'

type ListingResponse = Schemas['ListingResponse']

/** Content the API does not store yet (backend-gap #139). */
export interface ListingContent {
  description: string
  category: string | null
  photoUrls: string[]
  buyerName: string | null
  status: ListingStatus
  views: number | null
}

export interface ListingFilter {
  status?: ListingStatus
  q?: string
}

/** A screen asked for something only a backend gap can provide, and its mock is off. */
export class GapUnavailableError extends Error {
  constructor(readonly gap: Gap) {
    super(`Not available yet (backend gap ${gap}).`)
    this.name = 'GapUnavailableError'
  }
}

const EMPTY_CONTENT: ListingContent = {
  description: '',
  category: null,
  photoUrls: [],
  buyerName: null,
  status: 'active',
  views: null,
}

function toPolicy(raw: Record<string, unknown>): DisputePolicy {
  const list = (value: unknown) => (Array.isArray(value) ? value.map(String) : [])
  const resolution = raw.resolution
  return {
    doorRejectReasons: list(raw.door_reject_reasons) as DisputePolicy['doorRejectReasons'],
    acceptedProblems: list(raw.accepted_problems),
    resolution:
      resolution === 'refund' || resolution === 'repair' || resolution === 'replacement'
        ? resolution
        : undefined,
  }
}

/** The dispute policy as the backend stores it; `allowed_seller_actions` is what it enforces. */
export function toDisputePolicy(draft: ListingDraft['policy']): Record<string, unknown> {
  if (!draft.isSerialized) return { door_reject_reasons: draft.doorRejectReasons }
  const resolution = draft.resolution ?? 'refund'
  return {
    accepted_problems: draft.acceptedProblems,
    resolution,
    allowed_seller_actions: allowedSellerActions(resolution),
  }
}

export function toListing(response: ListingResponse, content: ListingContent = EMPTY_CONTENT): Listing {
  return {
    id: response.id,
    sellerId: response.seller_id,
    title: response.title,
    price: Number(response.price),
    isSerialized: response.is_serialized,
    uniqueId: response.unique_id,
    policy: toPolicy(response.dispute_policy),
    createdAt: response.created_at,
    updatedAt: response.updated_at,
    ...content,
  }
}

// backend-gap #139: content lives in the MSW store until the API has the fields.
const contentFor = async (id: string) =>
  isMocked('LISTING_CONTENT')
    ? gapRequest<ListingContent>('get', `/__gaps__/listings/${encodeURIComponent(id)}/content`).catch(
        () => EMPTY_CONTENT,
      )
    : EMPTY_CONTENT

export async function getListing(id: string): Promise<Listing> {
  const response = await api.get('/listings/{listing_id}', { path: { listing_id: id } })
  return toListing(response, await contentFor(id))
}

/**
 * Create through POST /listings. Content fields are saved only when their gap mock is on;
 * `contentSaved` tells the screen so it never pretends photos were stored.
 */
export async function createListing(
  draft: ListingDraft,
  photos: Blob[] = [],
): Promise<{ listing: Listing; contentSaved: boolean }> {
  const response = await api.post('/listings', {
    body: {
      title: draft.item.title,
      price: String(draft.item.price),
      is_serialized: draft.type.isSerialized,
      unique_id: draft.type.isSerialized ? (draft.type.uniqueId ?? null) : null,
      dispute_policy: toDisputePolicy(draft.policy),
    },
  })
  if (!isMocked('LISTING_CONTENT')) return { listing: toListing(response), contentSaved: false }
  // backend-gap #139
  const content = await gapRequest<ListingContent>('put', `/__gaps__/listings/${response.id}/content`, {
    body: {
      description: draft.item.description,
      category: draft.item.category,
      buyerName: draft.item.buyerName || null,
      photoUrls: photos.map((photo) => URL.createObjectURL(photo)),
      snapshot: response,
    },
  })
  return { listing: toListing(response, content), contentSaved: true }
}

/** The seller's listings (backend-gap #7). */
export async function listListings(filter: ListingFilter = {}): Promise<Listing[]> {
  if (!isMocked('SELLER_LISTS')) throw new GapUnavailableError('SELLER_LISTS')
  // backend-gap #7
  const rows = await gapRequest<{ listing: ListingResponse; content: ListingContent }[]>(
    'get',
    '/__gaps__/seller/listings',
    { query: { status: filter.status, q: filter.q } },
  )
  return rows.map((row) => toListing(row.listing, row.content))
}

/** Edit an unpaid listing (backend-gap #140). */
export async function updateListing(id: string, draft: ListingDraft): Promise<Listing> {
  if (!isMocked('LISTING_UPDATE')) throw new GapUnavailableError('LISTING_UPDATE')
  // backend-gap #140
  const row = await gapRequest<{ listing: ListingResponse; content: ListingContent }>(
    'patch',
    `/__gaps__/listings/${encodeURIComponent(id)}`,
    {
      body: {
        title: draft.item.title,
        price: String(draft.item.price),
        is_serialized: draft.type.isSerialized,
        unique_id: draft.type.isSerialized ? (draft.type.uniqueId ?? null) : null,
        dispute_policy: toDisputePolicy(draft.policy),
        description: draft.item.description,
        category: draft.item.category,
        buyerName: draft.item.buyerName || null,
      },
    },
  )
  return toListing(row.listing, row.content)
}

/** Archive: the link stops taking payments (backend-gap #140). */
export async function archiveListing(id: string): Promise<Listing> {
  if (!isMocked('LISTING_UPDATE')) throw new GapUnavailableError('LISTING_UPDATE')
  // backend-gap #140
  const row = await gapRequest<{ listing: ListingResponse; content: ListingContent }>(
    'post',
    `/__gaps__/listings/${encodeURIComponent(id)}/archive`,
  )
  return toListing(row.listing, row.content)
}

/**
 * Duplicate needs no gap: it pre-fills the create wizard from an existing listing. The serial number is left
 * blank on purpose, because a second phone or laptop has its own IMEI.
 */
export function draftFromListing(
  source: Listing,
): Partial<ListingDraft> & Pick<ListingDraft, 'type' | 'policy'> {
  const category = (CATEGORIES as readonly string[]).includes(source.category ?? '')
    ? (source.category as ListingDraft['item']['category'])
    : 'Other'
  return {
    item: { title: source.title, category, description: source.description, price: source.price },
    type: { isSerialized: source.isSerialized, uniqueId: undefined },
    policy: { isSerialized: source.isSerialized, ...source.policy },
  }
}
