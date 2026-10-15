import {
  allowedSellerActions,
  CATEGORIES,
  type DisputePolicy,
  type Listing,
  type ListingStatus,
} from '@/models/domain/listing'
import type { ListingDraft } from '@/models/schemas/listing'
import { api, type Schemas } from '../client'

type ListingResponse = Schemas['ListingResponse']

/** Content the API does not store yet (backend-gap #139); empty until #184 adds the adapter. */
export interface ListingContent {
  description: string
  category: string | null
  photoUrls: string[]
  buyerName: string | null
  status: ListingStatus
  views: number | null
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

export async function getListing(id: string): Promise<Listing> {
  const response = await api.get('/listings/{listing_id}', { path: { listing_id: id } })
  return toListing(response)
}

/** Create through POST /listings. Content fields (photos, description) arrive with backend-gap #139 (#184). */
export async function createListing(draft: ListingDraft): Promise<Listing> {
  const response = await api.post('/listings', {
    body: {
      title: draft.item.title,
      price: String(draft.item.price),
      is_serialized: draft.type.isSerialized,
      unique_id: draft.type.isSerialized ? (draft.type.uniqueId ?? null) : null,
      dispute_policy: toDisputePolicy(draft.policy),
    },
  })
  return toListing(response)
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
