import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { formatKes } from '@/lib/money'
import { isValidNational } from '@/lib/phone'
import { ApiError } from '@/models/api/errors'
import { policySummary, type Listing, type Resolution } from '@/models/domain/listing'
import { useListing } from '@/models/queries/listings'
import { payBaseSchema, type PayBaseValues } from '@/models/schemas/auth'
import { useOnline } from './useOnline'

export interface PayListingView {
  title: string
  price: number
  priceLabel: string
  photoUrls: string[]
  isSerialized: boolean
  description: string
  seller: { name: string; initials: string; meta: string }
  promise: { title: string; line: string }
  /** For a link meant for one buyer. */
  reservedFor: string | null
}

/** The seller's fix in buyer words (the seller-facing labels say what happens to the payout). */
const BUYER_FIX: Record<Resolution, string> = {
  refund: 'Refund',
  repair: 'Repair',
  replacement: 'Replacement',
}

const monthYear = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Nairobi',
})

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? `${words[0]?.[0]}${words[1]?.[0]}` : (words[0]?.slice(0, 2) ?? '')).toUpperCase()
}

/** What the buyer sees on B1, from the public listing. No invented data: no area, badge or fake counts. */
export function toPayListingView(listing: Listing): PayListingView {
  const { completedSales, memberSince } = listing.seller
  const since = `On Vekro since ${monthYear.format(new Date(memberSince))}`
  const resolution = listing.policy.resolution
  const offers = resolution && resolution !== 'refund' ? [BUYER_FIX[resolution], 'Refund'] : ['Refund']
  return {
    title: listing.title,
    price: listing.price,
    priceLabel: formatKes(listing.price),
    photoUrls: listing.photoUrls,
    isSerialized: listing.isSerialized,
    description: listing.description,
    seller: {
      name: listing.seller.name,
      initials: initials(listing.seller.name),
      meta:
        completedSales > 0
          ? `${completedSales} ${completedSales === 1 ? 'sale' : 'sales'} · ${since}`
          : since,
    },
    promise: listing.isSerialized
      ? {
          title: `Seller offers: ${offers.join(' · ')}`,
          line: 'You have 24 hours after delivery to report a problem.',
        }
      : {
          title: 'Check it at your door first',
          line: policySummary({ isSerialized: false, ...listing.policy }),
        },
    reservedFor: listing.buyerName,
  }
}

export type PayPageState = 'loading' | 'ready' | 'not_found' | 'error'

/** B1: the public listing, the pay card form and the Pay action (docs/PAGES.md B1, FRONTEND_CONTRACT A and B). */
export function usePayPage(listingId: string) {
  const listing = useListing(listingId)
  const online = useOnline()
  const [termsOpen, setTermsOpen] = useState(false)
  const form = useForm<PayBaseValues>({
    resolver: zodResolver(payBaseSchema),
    defaultValues: { phone: '', terms: false },
    mode: 'onTouched',
  })

  const state: PayPageState = listing.data
    ? 'ready'
    : listing.isPending
      ? 'loading'
      : listing.error instanceof ApiError && listing.error.kind === 'not_found'
        ? 'not_found'
        : 'error'

  const phone = form.watch('phone')
  const terms = form.watch('terms')
  const canPay = state === 'ready' && online && isValidNational(phone) && terms

  // Starting the payment lands with the save-details step (#84) and payment initiation (#85).
  const onPay = form.handleSubmit(() => undefined)

  return {
    state,
    listing: listing.data ? toPayListingView(listing.data) : null,
    retry: () => void listing.refetch(),
    online,
    form,
    canPay,
    onPay,
    paying: false,
    termsOpen,
    setTermsOpen,
  }
}
