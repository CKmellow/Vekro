import {
  allowedSellerActions,
  CATEGORIES,
  type DisputePolicy,
  type Listing,
  type ListingStatus,
} from '@/models/domain/listing'
import type { ListingDraft } from '@/models/schemas/listing'
import { api, API_BASE, gapRequest, type Schemas } from '../client'
import { isMocked, type Gap } from './gaps'

type ListingResponse = Schemas['ListingResponse']

/** Fields only the gap mocks provide: `archived` (#140) and view counts (none yet). */
export interface ListingExtras {
  status?: ListingStatus
  views?: number | null
}

/** A row from the #7 and #140 gap mocks. */
interface GapRow {
  listing: ListingResponse
  extras: ListingExtras
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

export function toPolicy(raw: Record<string, unknown>): DisputePolicy {
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

/** API photo paths are relative to the API root. */
export const photoUrl = (path: string) => `${API_BASE}${path}`

export function toListing(response: ListingResponse, extras: ListingExtras = {}): Listing {
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
    description: response.description,
    category: response.category,
    photoUrls: response.photos.map((photo) => photoUrl(photo.url)),
    buyerName: response.buyer_name,
    status: extras.status ?? response.status,
    views: extras.views ?? null,
    seller: {
      name: response.seller.name,
      memberSince: response.seller.member_since,
      completedSales: response.seller.completed_sales,
    },
  }
}

export async function getListing(id: string): Promise<Listing> {
  return toListing(await api.get('/listings/{listing_id}', { path: { listing_id: id } }))
}

/**
 * Create through POST /listings, then upload the photos in order (the first is the cover).
 * A failed photo does not undo the listing: `photosFailed` tells the screen how many are missing.
 */
export async function createListing(
  draft: ListingDraft,
  photos: Blob[] = [],
): Promise<{ listing: Listing; photosFailed: number }> {
  const response = await api.post('/listings', {
    body: {
      title: draft.item.title,
      description: draft.item.description,
      category: draft.item.category,
      buyer_name: draft.item.buyerName || null,
      price: String(draft.item.price),
      is_serialized: draft.type.isSerialized,
      unique_id: draft.type.isSerialized ? (draft.type.uniqueId ?? null) : null,
      dispute_policy: toDisputePolicy(draft.policy),
    },
  })
  const uploaded: ListingResponse['photos'] = []
  let photosFailed = 0
  for (const photo of photos) {
    try {
      uploaded.push(
        await api.upload('/listings/{listing_id}/photos', {
          path: { listing_id: response.id },
          body: photo,
        }),
      )
    } catch {
      photosFailed += 1
    }
  }
  return { listing: toListing({ ...response, photos: uploaded }), photosFailed }
}

/** The seller's listings (backend-gap #7). */
export async function listListings(filter: ListingFilter = {}): Promise<Listing[]> {
  if (!isMocked('SELLER_LISTS')) throw new GapUnavailableError('SELLER_LISTS')
  // backend-gap #7
  const rows = await gapRequest<GapRow[]>('get', '/__gaps__/seller/listings', {
    query: { status: filter.status, q: filter.q },
  })
  return rows.map((row) => toListing(row.listing, row.extras))
}

/** Edit an unpaid listing (backend-gap #140). */
export async function updateListing(id: string, draft: ListingDraft): Promise<Listing> {
  if (!isMocked('LISTING_UPDATE')) throw new GapUnavailableError('LISTING_UPDATE')
  // backend-gap #140
  const row = await gapRequest<GapRow>('patch', `/__gaps__/listings/${encodeURIComponent(id)}`, {
    body: {
      title: draft.item.title,
      price: String(draft.item.price),
      is_serialized: draft.type.isSerialized,
      unique_id: draft.type.isSerialized ? (draft.type.uniqueId ?? null) : null,
      dispute_policy: toDisputePolicy(draft.policy),
      description: draft.item.description,
      category: draft.item.category,
      buyer_name: draft.item.buyerName || null,
    },
  })
  return toListing(row.listing, row.extras)
}

/** Archive: the link stops taking payments (backend-gap #140). */
export async function archiveListing(id: string): Promise<Listing> {
  if (!isMocked('LISTING_UPDATE')) throw new GapUnavailableError('LISTING_UPDATE')
  // backend-gap #140
  const row = await gapRequest<GapRow>('post', `/__gaps__/listings/${encodeURIComponent(id)}/archive`)
  return toListing(row.listing, row.extras)
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
