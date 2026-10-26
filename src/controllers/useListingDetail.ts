import { useNavigate, useParams, useSearchParams } from 'react-router'
import { payoutBreakdown } from '@/lib/fees'
import { ApiError } from '@/models/api/errors'
import { toast } from '@/lib/toast'
import { LISTING_STATUS_VIEW, policySummary } from '@/models/domain/listing'
import { useArchiveListing, useListing, useRestoreListing } from '@/models/queries/listings'
import { listingLink } from './useListingsPage'
import { useStaleSince } from './useOnline'

async function copy(text: string, done: string) {
  try {
    await navigator.clipboard.writeText(text)
    toast.show(done)
  } catch {
    toast.show("Couldn't copy. Select the text and copy it yourself.", 'danger')
  }
}

/** S9: one listing, its Trust Link and how to share it. */
export function useListingDetail() {
  const { id = '' } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const query = useListing(id)
  const staleSince = useStaleSince(query)
  const archive = useArchiveListing()
  const restore = useRestoreListing()
  const listing = query.data
  const link = listingLink(id)

  if (!listing && query.isPending) return { state: 'loading' as const }
  if (!listing) {
    return {
      state: 'error' as const,
      notFound: query.error instanceof ApiError && query.error.kind === 'not_found',
      retry: () => void query.refetch(),
    }
  }

  const paid = listing.status === 'sold' || listing.status === 'awaiting_payment'
  const archived = listing.status === 'archived'
  const price = listing.price
  const caption = `${listing.title}, KES ${price.toLocaleString('en-KE')}. Pay safely with Vekro escrow: ${link}`

  return {
    state: 'ready' as const,
    staleSince,
    justPublished: params.get('published') === '1',
    listing: {
      title: listing.title,
      price,
      photoUrls: listing.photoUrls,
      category: listing.category,
      isSerialized: listing.isSerialized,
      uniqueIdTail: listing.uniqueId ? listing.uniqueId.replace(/\s+/g, '').slice(-4) : null,
      policyLine: policySummary({ isSerialized: listing.isSerialized, ...listing.policy }),
      status: LISTING_STATUS_VIEW[listing.status],
      views: listing.views,
      payout: payoutBreakdown(price),
    },
    paid,
    archived,
    link,
    caption,
    share: {
      whatsapp: `https://wa.me/?text=${encodeURIComponent(caption)}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`,
      telegram: `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(`${listing.title}. Pay safely with Vekro escrow.`)}`,
    },
    copyLink: () => void copy(link, 'Link copied'),
    copyMessage: () => void copy(caption, 'Message copied'),
    edit: () => navigate(`/seller/listings/${id}/edit`),
    duplicate: () => navigate(`/seller/listings/new?from=${id}`),
    archive: async () => {
      try {
        await archive.mutateAsync(id)
        toast.show('Archived. The link no longer takes payments.')
      } catch {
        toast.show("Couldn't archive this listing", 'danger')
      }
    },
    archivePending: archive.isPending,
    restore: async () => {
      try {
        await restore.mutateAsync(id)
        toast.show('Restored. The link takes payments again.')
      } catch {
        toast.show("Couldn't restore this listing", 'danger')
      }
    },
    restorePending: restore.isPending,
  }
}
