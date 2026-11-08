import type { Schemas } from '@/models/api/client'
import { parseCanonical } from './canonical'
import { fromHex, leafHash, sameBytes, ZERO_HASH } from './hash'
import { verifyInclusion, type ProofStep } from './merkle'
import type { RootOf } from './verify'

export type SellerTrackRecord = Schemas['SellerTrackRecordResponse']

/**
 * A seller's verified sales (backend #231, docs/frontend-verification-contract.md section 6): only
 * sales whose leaf recomputes, whose proof reaches the registry root, and whose payload names this
 * seller. Never more than that; the proofs cannot show nothing was left out.
 */
export async function countVerifiedSales(
  record: SellerTrackRecord,
  rootOf: RootOf,
): Promise<{ verified: number; pending: number }> {
  let verified = 0
  let pending = 0
  for (const sale of record.sales) {
    const body = parseCanonical(sale.payload)
    if (body?.type !== 'seller_sale_completed' || body.seller_id !== record.seller_id) continue
    const salt = fromHex(sale.salt)
    const prev = fromHex(sale.prev_event_hash)
    if (!salt || !prev) continue
    const leaf = leafHash(salt, prev, sale.payload)
    if (!sameBytes(leaf, fromHex(sale.leaf_hash))) continue
    if (!sale.anchor) {
      pending += 1
      continue
    }
    const root = await rootOf(sale.anchor.batch_id)
    if (sameBytes(root, ZERO_HASH)) {
      pending += 1
      continue
    }
    const proof: ProofStep[] = []
    for (const step of sale.anchor.proof) {
      const sibling = fromHex(step.sibling)
      if (sibling) proof.push({ sibling, side: step.side })
    }
    if (verifyInclusion(leaf, proof, root, sale.anchor.leaf_index, sale.anchor.leaf_count)) verified += 1
  }
  return { verified, pending }
}
