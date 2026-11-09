import { useState } from 'react'
import { downloadJson } from '@/lib/download'
import { formatKes } from '@/lib/money'
import { useLiabilitiesCheck, useOrderVerification } from '@/models/queries/verification'

export type RecordState = 'checking' | 'verified' | 'pending' | 'tampered' | 'unavailable'

/** The buyer's line: their held money counted in Vekro's published total (#288). */
export interface HeldMoney {
  state: 'included' | 'pending' | 'tampered' | 'unavailable'
  amount: string
  total: string
}

export interface SealedBatch {
  id: number
  block: number | null
  txUrl: string | null
}

const NETWORKS: Record<number, string> = {
  84532: 'Base Sepolia (test network)',
  8453: 'Base',
  31337: 'Local test chain',
}

/**
 * The "Verified record" panel on B3 and S6 (#279): the order's tamper-evident record, checked in this
 * browser against the public registry. Null when no registry is configured. For the buyer it also
 * checks that the money held for this order is counted in Vekro's published total (#288).
 */
export function useVerifiedRecord(orderId: string, version: string, { buyer = false } = {}) {
  const query = useOrderVerification(orderId, version)
  const liabilities = useLiabilitiesCheck(orderId, version, buyer)
  const [detailsOpen, setDetailsOpen] = useState(false)
  if (!query.isEnabled) return null

  const check = liabilities.data
  const heldMoney: HeldMoney | null = check
    ? {
        state: (
          {
            INCLUDED: 'included',
            PENDING: 'pending',
            TAMPERED: 'tampered',
            UNAVAILABLE: 'unavailable',
          } as const
        )[check.verdict],
        amount: formatKes(check.amount),
        total: formatKes(check.total),
      }
    : null

  const data = query.data
  const state: RecordState = !data
    ? query.isError
      ? 'unavailable'
      : 'checking'
    : (
        {
          VERIFIED: 'verified',
          PARTIALLY_PENDING: 'pending',
          TAMPERED: 'tampered',
          UNAVAILABLE: 'unavailable',
        } as const
      )[data.report.verdict]

  const batches: SealedBatch[] = []
  for (const event of data?.bundle.events ?? []) {
    const anchor = event.anchor
    if (!anchor || batches.some((batch) => batch.id === anchor.batch_id)) continue
    const explorer = data?.registry.explorer
    batches.push({
      id: anchor.batch_id,
      block: anchor.block_number ?? null,
      txUrl: explorer && anchor.tx_hash ? `${explorer}/tx/${anchor.tx_hash}` : null,
    })
  }

  return {
    state,
    sealed: data?.report.anchored ?? 0,
    total: data?.report.total ?? 0,
    network: data ? (NETWORKS[data.registry.chainId] ?? `Chain ${data.registry.chainId}`) : '',
    registry: data?.registry.address ?? '',
    batches,
    heldMoney,
    detailsOpen,
    setDetailsOpen,
    retry: () => void query.refetch(),
    download: data
      ? () => downloadJson(`vekro-${data.bundle.reference}-record.json`, data.bundle)
      : undefined,
  }
}

export type VerifiedRecord = NonNullable<ReturnType<typeof useVerifiedRecord>>
