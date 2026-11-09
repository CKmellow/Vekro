import { useQuery } from '@tanstack/react-query'
import { createRootReader } from '@/models/api/registry'
import { registryConfig, type RegistryConfig } from '@/models/api/registryConfig'
import { getLiabilitiesProof, getVerification, type VerificationBundle } from '@/models/api/transactions'
import { verifyLiabilities, type LiabilitiesCheck } from '@/models/domain/verification/liabilities'
import { verifyBundle, type RootOf, type VerificationReport } from '@/models/domain/verification/verify'

export interface OrderVerification {
  bundle: VerificationBundle
  report: VerificationReport
  registry: RegistryConfig
}

const config = registryConfig()
const readers = new Map<string, RootOf>()
const readerFor = (registry: RegistryConfig) => {
  if (!readers.has(registry.address)) readers.set(registry.address, createRootReader(registry))
  return readers.get(registry.address) as RootOf
}

/**
 * The order's record, checked in the browser against the pinned registry. Off (and the panel hidden)
 * when no registry is configured. `version` (the order status) refetches after each step.
 */
export function useOrderVerification(
  orderId: string,
  version: string,
  registry: RegistryConfig | null = config,
) {
  return useQuery({
    queryKey: ['orders', orderId, 'verification', version] as const,
    enabled: registry !== null && orderId !== '',
    staleTime: 60_000,
    retry: 1,
    queryFn: async ({ signal }): Promise<OrderVerification> => {
      const pinned = registry as RegistryConfig
      const bundle = await getVerification(orderId, signal)
      const named = bundle.chain.registry_address?.toLowerCase()
      if (named && named !== pinned.address) {
        // The server names a different registry: never verify against a registry it chose.
        const report: VerificationReport = {
          verdict: 'UNAVAILABLE',
          findings: [{ code: 'chain_unavailable' }],
          anchored: 0,
          pending: 0,
          total: bundle.events.length,
        }
        return { bundle, report, registry: pinned }
      }
      return { bundle, report: await verifyBundle(bundle, readerFor(pinned)), registry: pinned }
    },
  })
}

/**
 * "Your KES X is included in Vekro's published total" (backend #261), checked in the browser against
 * the same pinned registry. Null data when the order has no proof (not held now, or not the buyer).
 */
export function useLiabilitiesCheck(
  orderId: string,
  version: string,
  enabled: boolean,
  registry: RegistryConfig | null = config,
) {
  return useQuery({
    queryKey: ['orders', orderId, 'liabilities', version] as const,
    enabled: enabled && registry !== null && orderId !== '',
    staleTime: 60_000,
    retry: 1,
    queryFn: async ({ signal }): Promise<LiabilitiesCheck | null> => {
      const proof = await getLiabilitiesProof(orderId, signal)
      return proof ? verifyLiabilities(proof, orderId, readerFor(registry as RegistryConfig)) : null
    },
  })
}

export const verificationConfigured = () => config !== null
