/** Listings as the screens see them: the API's ListingResponse plus content fields from backend-gap #139. */

export type ListingStatus = 'draft' | 'active' | 'awaiting_payment' | 'sold' | 'archived'

export type DoorRejectReason = 'damaged' | 'wrong_item' | 'not_as_described'
export type Resolution = 'refund' | 'repair' | 'replacement'
/** The backend's seller resolution actions (SellerResolutionActionRequest.action). */
export type SellerAction = 'refund_issued' | 'repair_shipped' | 'replacement_shipped'

export interface DisputePolicy {
  /** Standard items: reasons the buyer may reject at the door. */
  doorRejectReasons: DoorRejectReason[]
  /** Serial-numbered items: problems the buyer can report in the 24-hour window. */
  acceptedProblems: string[]
  /** Serial-numbered items: what the seller does when a problem is confirmed. */
  resolution?: Resolution
}

export interface Listing {
  id: string
  sellerId: string
  title: string
  /** KES, whole shillings. */
  price: number
  isSerialized: boolean
  uniqueId: string | null
  policy: DisputePolicy
  createdAt: string
  updatedAt: string
  // Content fields (backend-gap #139): empty until the backend stores them.
  description: string
  category: string | null
  photoUrls: string[]
  /** For a private link to one buyer. */
  buyerName: string | null
  status: ListingStatus
  views: number | null
}

export const CATEGORIES = [
  'Phones and tablets',
  'Laptops and computers',
  'TVs and audio',
  'Fashion',
  'Shoes',
  'Home and furniture',
  'Beauty',
  'Other',
] as const

export const DOOR_REJECT_REASONS: { value: DoorRejectReason; label: string }[] = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'wrong_item', label: 'Wrong item' },
  { value: 'not_as_described', label: 'Not as described' },
]

export const RESOLUTIONS: { value: Resolution; label: string; description: string }[] = [
  { value: 'refund', label: 'Refund', description: 'Money goes back to the buyer' },
  {
    value: 'repair',
    label: 'Repair then release',
    description: "You fix it, the buyer confirms, then you're paid",
  },
  {
    value: 'replacement',
    label: 'Replacement',
    description: "You send a new one, the buyer confirms, then you're paid",
  },
]

const PHONE_PROBLEMS = [
  "Won't power on",
  'Screen or touch problem',
  'Battery drains fast',
  'Software or app problem',
  'Camera problem',
]

/** Preset problem chips by category (PAGES.md 0.1); sellers can add their own. */
export function problemPresets(category: string | null): string[] {
  switch (category) {
    case 'Phones and tablets':
      return PHONE_PROBLEMS
    case 'Laptops and computers':
      return [
        "Won't power on",
        'Screen problem',
        'Keyboard or trackpad problem',
        'Battery drains fast',
        'Overheating',
      ]
    case 'TVs and audio':
      return ["Won't power on", 'No picture', 'No sound', 'Remote or ports not working']
    default:
      return ["Won't power on", "Doesn't work as described", 'Missing parts']
  }
}

/**
 * The seller actions the backend allows for a resolution. Refunding is always allowed: it is the
 * buyer-safe fallback when a repair or replacement is not possible.
 */
export function allowedSellerActions(resolution: Resolution): SellerAction[] {
  if (resolution === 'repair') return ['repair_shipped', 'refund_issued']
  if (resolution === 'replacement') return ['replacement_shipped', 'refund_issued']
  return ['refund_issued']
}

/** The last characters buyers check at the door. */
export const uniqueIdTail = (uniqueId: string, length = 4) => uniqueId.replace(/\s+/g, '').slice(-length)

/** One line for buyers: what they can do if something is wrong. */
export function policySummary(policy: {
  isSerialized: boolean
  doorRejectReasons: DoorRejectReason[]
  acceptedProblems: string[]
  resolution?: Resolution
}): string {
  if (!policy.isSerialized) {
    const reasons = DOOR_REJECT_REASONS.filter((r) => policy.doorRejectReasons.includes(r.value)).map(
      (r) => r.label,
    )
    return reasons.length
      ? `Reject at the door for: ${reasons.join(', ')}.`
      : 'Inspect at the door before you give your code.'
  }
  const resolution = RESOLUTIONS.find((r) => r.value === policy.resolution)?.label
  const problems = policy.acceptedProblems.length ? ` for ${policy.acceptedProblems.join(', ')}` : ''
  return `Report a problem within 24 hours of delivery${problems}.${resolution ? ` The seller's fix: ${resolution}.` : ''}`
}
