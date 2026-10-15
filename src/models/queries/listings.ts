import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createListing, getListing } from '@/models/api/adapters/listings'
import type { ListingDraft } from '@/models/schemas/listing'

export const listingKeys = {
  all: ['listings'] as const,
  detail: (id: string) => ['listings', 'detail', id] as const,
}

export const useListing = (id: string) =>
  useQuery({ queryKey: listingKeys.detail(id), queryFn: () => getListing(id) })

export function useCreateListing() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (draft: ListingDraft) => createListing(draft),
    onSuccess: (listing) => {
      client.setQueryData(listingKeys.detail(listing.id), listing)
      void client.invalidateQueries({ queryKey: [...listingKeys.all, 'list'] })
    },
  })
}
