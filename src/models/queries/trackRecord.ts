import { useQuery } from '@tanstack/react-query'
import { registryConfig } from '@/models/api/registryConfig'
import { getSellerTrackRecord } from '@/models/api/sellerProfile'

const config = registryConfig()

/**
 * How many of the seller's sales this browser verified against the public registry (B1, #280).
 * The hashing code loads only when a registry is configured, so the Trust Link stays light.
 */
export function useVerifiedSales(sellerId: string | undefined) {
  return useQuery({
    queryKey: ['sellers', sellerId, 'verified-sales'] as const,
    enabled: config !== null && Boolean(sellerId),
    staleTime: 5 * 60_000,
    retry: false,
    queryFn: async ({ signal }) => {
      const [record, { createRootReader }, { countVerifiedSales }] = await Promise.all([
        getSellerTrackRecord(sellerId as string, signal),
        import('@/models/api/registry'),
        import('@/models/domain/verification/trackRecord'),
      ])
      return countVerifiedSales(record, createRootReader(config as NonNullable<typeof config>))
    },
  })
}
