import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  archiveListing,
  createListing,
  getListing,
  listListings,
  restoreListing,
  updateListing,
  type ListingFilter,
} from '@/models/api/adapters/listings'
import type { Listing } from '@/models/domain/listing'
import type { ListingDraft } from '@/models/schemas/listing'

export const listingKeys = {
  all: ['listings'] as const,
  list: (filter: ListingFilter) => ['listings', 'list', filter] as const,
  detail: (id: string) => ['listings', 'detail', id] as const,
}

export const useListing = (id: string, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () => getListing(id),
    enabled: options.enabled ?? true,
  })

export const useListings = (filter: ListingFilter = {}) =>
  useQuery({ queryKey: listingKeys.list(filter), queryFn: () => listListings(filter) })

function useListingWrite<V>(run: (variables: V) => Promise<Listing>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSuccess: (listing) => {
      client.setQueryData(listingKeys.detail(listing.id), listing)
      void client.invalidateQueries({ queryKey: [...listingKeys.all, 'list'] })
    },
  })
}

export function useCreateListing() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ draft, photos }: { draft: ListingDraft; photos?: Blob[] }) => createListing(draft, photos),
    onSuccess: ({ listing }) => {
      client.setQueryData(listingKeys.detail(listing.id), listing)
      void client.invalidateQueries({ queryKey: [...listingKeys.all, 'list'] })
    },
  })
}

export const useUpdateListing = () =>
  useListingWrite(({ id, draft }: { id: string; draft: ListingDraft }) => updateListing(id, draft))
export const useArchiveListing = () => useListingWrite((id: string) => archiveListing(id))
export const useRestoreListing = () => useListingWrite((id: string) => restoreListing(id))
