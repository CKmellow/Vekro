import type { Schemas } from '@/models/api/client'
import { parseCanonical } from './canonical'
import { fromHex, leafHash, sameBytes, toHex, ZERO_HASH } from './hash'
import { verifyInclusion, type ProofStep } from './merkle'
import { orderCommit, parseCents, verifySumProof } from './sumTree'
import { RegistryUnavailableError, type RootOf } from './verify'

export type LiabilitiesProof = Schemas['LiabilitiesProofResponse']
export type LiabilitiesVerdict = 'INCLUDED' | 'PENDING' | 'TAMPERED' | 'UNAVAILABLE'

export interface LiabilitiesCheck {
  verdict: LiabilitiesVerdict
  /** KES, whole shillings. */
  amount: number
  total: number
}

/** "6500.00" -> 650000n cents; null for anything else. */
function cents(money: string | null | undefined): bigint | null {
  const match = /^(\d+)\.(\d{2})$/.exec(money ?? '')
  return match?.[1] !== undefined && match[2] !== undefined ? BigInt(match[1] + match[2]) : null
}

/**
 * The buyer's check that their held money is counted in Vekro's published total (backend #261,
 * docs/anchoring.md 4b), entirely in the browser:
 * 1. the leaf commits to this order (recomputed from its id), so it cannot be someone else's;
 * 2. the sum proof folds to the root, with no negative or overflowing sum on the way;
 * 3. the root and total equal the anchored liabilities_snapshot payload;
 * 4. that event's leaf recomputes and its batch proof reaches the root read from the registry.
 */
export async function verifyLiabilities(
  proof: LiabilitiesProof,
  orderId: string,
  rootOf: RootOf,
): Promise<LiabilitiesCheck> {
  const amountCents = parseCents(proof.leaf.amount_cents)
  const totalCents = parseCents(proof.root.sum)
  const result = (verdict: LiabilitiesVerdict): LiabilitiesCheck => ({
    verdict,
    amount: Number((amountCents ?? 0n) / 100n),
    total: Number((totalCents ?? 0n) / 100n),
  })

  if (proof.leaf.order_commit.toLowerCase() !== toHex(orderCommit(orderId))) return result('TAMPERED')
  if (!verifySumProof(proof.leaf, proof.proof, proof.root)) return result('TAMPERED')

  const event = proof.anchor
  if (!event) return result('PENDING')
  const body = parseCanonical(event.payload)
  if (
    body?.type !== 'liabilities_snapshot' ||
    body.root !== proof.root.hash ||
    cents(typeof body.total === 'string' ? body.total : null) !== totalCents
  )
    return result('TAMPERED')

  const salt = fromHex(event.salt)
  const prev = fromHex(event.prev_event_hash)
  if (!salt || !prev) return result('TAMPERED')
  const leaf = leafHash(salt, prev, event.payload)
  if (!sameBytes(leaf, fromHex(event.leaf_hash))) return result('TAMPERED')
  if (!event.anchor) return result('PENDING')

  let root: Uint8Array
  try {
    root = await rootOf(event.anchor.batch_id)
  } catch (error) {
    if (error instanceof RegistryUnavailableError) return result('UNAVAILABLE')
    throw error
  }
  if (sameBytes(root, ZERO_HASH)) return result('PENDING')
  const steps: ProofStep[] = []
  for (const step of event.anchor.proof) {
    const sibling = fromHex(step.sibling)
    if (!sibling) return result('TAMPERED')
    steps.push({ sibling, side: step.side })
  }
  const included = verifyInclusion(leaf, steps, root, event.anchor.leaf_index, event.anchor.leaf_count)
  return result(included ? 'INCLUDED' : 'TAMPERED')
}
