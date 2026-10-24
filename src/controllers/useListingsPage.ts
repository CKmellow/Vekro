import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from '@/lib/toast'
import { LISTING_STATUS_VIEW, type Listing, type ListingStatus } from '@/models/domain/listing'
import { useArchiveListing, useListings } from '@/models/queries/listings'

const FILTERS: { value: ListingStatus; label: string }[] = [
  { value: 'active', label: 'Active' },
  { value: 'awaiting_payment', label: 'Awaiting payment' },
  { value: 'sold', label: 'Sold' },
  { value: 'archived', label: 'Archived' },
]

export const listingLink = (id: string) => `${window.location.origin}/pay/${id}`

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** S8: the seller's listings (GET /listings). Counts come with every page, so one query serves both. */
export function useListingsPage() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<ListingStatus>('active')
  const [q, setQ] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [archiving, setArchiving] = useState<Listing | null>(null)
  const shown = useListings({ status, q: q.trim() || undefined })
  const page = shown.data
  const archive = useArchiveListing()

  const copyLink = async (listing: Listing) => {
    const ok = await copy(listingLink(listing.id))
    toast.show(ok ? 'Link copied' : "Couldn't copy. Open the listing to share it.", ok ? 'success' : 'danger')
  }
  const share = async (listing: Listing) => {
    const url = listingLink(listing.id)
    if (typeof navigator.share === 'function') {
      await navigator
        .share({ title: listing.title, text: 'Pay safely with Vekro escrow', url })
        .catch(() => {})
    } else await copyLink(listing)
  }

  const counts = page?.counts
  const total = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined

  return {
    filters: FILTERS.map((f) => ({
      value: f.value,
      label: f.label,
      count: counts?.[f.value],
    })),
    status,
    setStatus,
    q,
    setQ,
    view,
    setView,
    total,
    listings: (page?.listings ?? []).map((listing) => ({
      data: {
        id: listing.id,
        title: listing.title,
        price: listing.price,
        isSerialized: listing.isSerialized,
        photoUrl: listing.photoUrls[0],
        views: listing.views,
        status: LISTING_STATUS_VIEW[listing.status],
        locked: listing.status === 'sold' || listing.status === 'awaiting_payment',
      },
      actions: {
        onOpen: () => navigate(`/seller/listings/${listing.id}`),
        onCopy: () => void copyLink(listing),
        onShare: () => void share(listing),
        onEdit: () => navigate(`/seller/listings/${listing.id}/edit`),
        onDuplicate: () => navigate(`/seller/listings/new?from=${listing.id}`),
        onArchive: () => setArchiving(listing),
      },
    })),
    state: page
      ? total === 0
        ? ('empty' as const)
        : page.listings.length === 0
          ? ('no-results' as const)
          : ('ready' as const)
      : shown.isPending
        ? ('loading' as const)
        : ('error' as const),
    retry: () => void shown.refetch(),
    clearFilters: () => {
      setQ('')
      setStatus('active')
    },
    archiving,
    askArchive: setArchiving,
    confirmArchive: async () => {
      if (!archiving) return
      try {
        await archive.mutateAsync(archiving.id)
        toast.show('Archived. The link no longer takes payments.')
      } catch {
        toast.show("Couldn't archive this listing", 'danger')
      } finally {
        setArchiving(null)
      }
    },
    archivePending: archive.isPending,
  }
}
