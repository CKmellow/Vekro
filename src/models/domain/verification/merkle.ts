import { nodeHash, sameBytes } from './hash'

/**
 * RFC 6962 Merkle trees over leaf hashes (backend app/services/anchoring/merkle.py): a tree of n
 * leaves splits at the largest power of two below n, and the last node is never duplicated.
 */
export type Side = 'left' | 'right'
export interface ProofStep {
  sibling: Uint8Array
  side: Side
}

function splitPoint(size: number): number {
  let k = 1
  while (k * 2 < size) k *= 2
  return k
}

export function merkleRoot(leaves: Uint8Array[]): Uint8Array {
  if (leaves.length === 0) throw new Error('A Merkle tree needs at least one leaf.')
  if (leaves.length === 1) return leaves[0] as Uint8Array
  const k = splitPoint(leaves.length)
  return nodeHash(merkleRoot(leaves.slice(0, k)), merkleRoot(leaves.slice(k)))
}

/** The sides a proof for `index` in a tree of `size` leaves must have, leaf upwards. */
export function proofSides(index: number, size: number): Side[] | null {
  if (!Number.isInteger(index) || !Number.isInteger(size) || index < 0 || index >= size) return null
  const sides: Side[] = []
  let start = 0
  let end = size
  while (end - start > 1) {
    const mid = start + splitPoint(end - start)
    if (index < mid) {
      sides.push('right')
      end = mid
    } else {
      sides.push('left')
      start = mid
    }
  }
  return sides.reverse()
}

export function rootFromProof(leaf: Uint8Array, proof: ProofStep[]): Uint8Array {
  return proof.reduce(
    (running, step) =>
      step.side === 'left' ? nodeHash(step.sibling, running) : nodeHash(running, step.sibling),
    leaf,
  )
}

/** True when the proof has the shape for `index` in a tree of `size` and leads to `root`. */
export function verifyInclusion(
  leaf: Uint8Array,
  proof: ProofStep[],
  root: Uint8Array,
  index: number,
  size: number,
): boolean {
  const sides = proofSides(index, size)
  if (!sides || sides.length !== proof.length || sides.some((side, i) => proof[i]?.side !== side))
    return false
  if (proof.some((step) => step.sibling.length !== 32)) return false
  return sameBytes(rootFromProof(leaf, proof), root)
}
