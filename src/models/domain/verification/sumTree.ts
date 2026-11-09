import { utf8ToBytes } from '@noble/hashes/utils.js'
import { fromHex, keccak256, sameBytes } from './hash'
import type { Side } from './merkle'

/**
 * The liabilities Merkle sum tree (backend #259, docs/anchoring.md 4b), byte-identical with the
 * backend's `sum_tree.py` and checked against the shared golden vectors (`sumTreeVectors.json`).
 *
 *   leaf = keccak256(0x00 || salt || order_commit || uint64_be(amount_cents))
 *   node = keccak256(0x01 || left.hash || uint64_be(left.sum) || right.hash || uint64_be(right.sum))
 *
 * Sums are BigInt: they can pass 2**53. Every amount and sum must be a whole number in
 * 0..2**64-1; a negative or overflowing sibling (the way a total is quietly lowered) fails here.
 */
export const MAX_SUM = 2n ** 64n - 1n
const LEAF = Uint8Array.of(0)
const NODE = Uint8Array.of(1)

export interface SumNode {
  hash: Uint8Array
  sum: bigint
}

export interface SumProofStep {
  sibling_hash: string
  sibling_sum: string
  side: Side
}

/** A decimal string of a whole number of cents, or null (negative, fractional, malformed). */
export function parseCents(value: string): bigint | null {
  if (!/^\d+$/.test(value)) return null
  const cents = BigInt(value)
  return cents <= MAX_SUM ? cents : null
}

function u64(value: bigint): Uint8Array {
  const out = new Uint8Array(8)
  let rest = value
  for (let i = 7; i >= 0; i--) {
    out[i] = Number(rest & 0xffn)
    rest >>= 8n
  }
  return out
}

export function orderCommit(orderId: string): Uint8Array {
  return keccak256(utf8ToBytes(`vekro-liability-order:${orderId.toLowerCase()}`))
}

export function sumLeaf(salt: Uint8Array, commit: Uint8Array, cents: bigint): SumNode {
  return { hash: keccak256(LEAF, salt, commit, u64(cents)), sum: cents }
}

/** Null when the two sums overflow 2**64-1. */
export function sumNode(left: SumNode, right: SumNode): SumNode | null {
  const sum = left.sum + right.sum
  if (sum > MAX_SUM) return null
  return { hash: keccak256(NODE, left.hash, u64(left.sum), right.hash, u64(right.sum)), sum }
}

export interface SumLeafInput {
  salt: string
  order_commit: string
  amount_cents: string
}

/** True when the leaf folds, through the proof, to exactly this root hash and total. */
export function verifySumProof(
  leaf: SumLeafInput,
  proof: SumProofStep[],
  root: { hash: string; sum: string },
): boolean {
  const salt = fromHex(leaf.salt)
  const commit = fromHex(leaf.order_commit)
  const cents = parseCents(leaf.amount_cents)
  const rootHash = fromHex(root.hash)
  const rootSum = parseCents(root.sum)
  if (!salt || salt.length !== 32 || !commit || commit.length !== 32) return false
  if (cents === null || rootHash === null || rootSum === null) return false
  let running: SumNode | null = sumLeaf(salt, commit, cents)
  for (const step of proof) {
    const hash = fromHex(step.sibling_hash)
    const sum = parseCents(step.sibling_sum)
    if (!running || !hash || hash.length !== 32 || sum === null) return false
    const sibling = { hash, sum }
    if (step.side === 'left') running = sumNode(sibling, running)
    else if (step.side === 'right') running = sumNode(running, sibling)
    else return false
  }
  return running !== null && sameBytes(running.hash, rootHash) && running.sum === rootSum
}
