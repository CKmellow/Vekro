import { describe, expect, it } from 'vitest'
import { canonicalJson } from './canonical'
import { keccak256, leafHash, toHex, ZERO_HASH } from './hash'
import { verifyLiabilities, type LiabilitiesProof } from './liabilities'
import vectors from './sumTreeVectors.json'
import { RegistryUnavailableError } from './verify'

type Tree = (typeof vectors.trees)[number]
const tree = vectors.trees.find((t) => t.size === 3) as Tree
const [first, second] = vectors.order_commit as unknown as [
  { transaction_id: string },
  { transaction_id: string },
]
const ORDER = first.transaction_id // leaf 0 of every vector tree is this order
const leaf0 = tree.leaves[0] as Tree['leaves'][number]
const salt = keccak256(Uint8Array.of(7))
const prev = keccak256(Uint8Array.of(8))
const money = (cents: string) => `${BigInt(cents) / 100n}.${String(BigInt(cents) % 100n).padStart(2, '0')}`

function proofWith(
  payloadTotal = money(tree.root.sum),
  withAnchor = true,
): {
  proof: LiabilitiesProof
  batchRoot: Uint8Array
} {
  const payload = canonicalJson({
    v: 1,
    type: 'liabilities_snapshot',
    transaction_id: null,
    at: '2026-11-09T08:00:00.000000Z',
    snapshot_id: 1,
    root: tree.root.hash,
    total: payloadTotal,
    leaf_count: 3,
  })
  const leaf = leafHash(salt, prev, payload)
  const proof = {
    snapshot_id: 1,
    created_at: '2026-11-09T08:00:00Z',
    root: tree.root,
    total: money(tree.root.sum),
    leaf_count: 3,
    leaf: leaf0,
    proof: tree.proofs[0],
    anchor: withAnchor
      ? {
          event_type: 'liabilities_snapshot',
          schema_version: 1,
          payload,
          salt: toHex(salt),
          prev_event_hash: toHex(prev),
          leaf_hash: toHex(leaf),
          created_at: '2026-11-09T08:00:00Z',
          anchor: { batch_id: 4, leaf_index: 0, leaf_count: 1, proof: [], tx_hash: null, block_number: null },
        }
      : null,
  } as unknown as LiabilitiesProof
  return { proof, batchRoot: leaf }
}

describe('verifyLiabilities', () => {
  it("includes the buyer's amount when every link checks out", async () => {
    const { proof, batchRoot } = proofWith()
    const check = await verifyLiabilities(proof, ORDER, async () => batchRoot)
    expect(check.verdict).toBe('INCLUDED')
    expect(check.amount).toBe(Number(BigInt(leaf0.amount_cents) / 100n))
    expect(check.total).toBe(Number(BigInt(tree.root.sum) / 100n))
  })

  it("refuses someone else's leaf", async () => {
    const { proof, batchRoot } = proofWith()
    const check = await verifyLiabilities(proof, second.transaction_id, async () => batchRoot)
    expect(check.verdict).toBe('TAMPERED')
  })

  it('refuses a total that differs from the anchored one', async () => {
    const { proof, batchRoot } = proofWith('1.00')
    expect((await verifyLiabilities(proof, ORDER, async () => batchRoot)).verdict).toBe('TAMPERED')
  })

  it('is pending before the snapshot is anchored or its batch confirmed', async () => {
    expect(
      (await verifyLiabilities(proofWith(undefined, false).proof, ORDER, async () => ZERO_HASH)).verdict,
    ).toBe('PENDING')
    expect((await verifyLiabilities(proofWith().proof, ORDER, async () => ZERO_HASH)).verdict).toBe('PENDING')
  })

  it('is unavailable when the registry cannot be read, and tampered on a different root', async () => {
    const unreachable = async (): Promise<Uint8Array> => {
      throw new RegistryUnavailableError('down')
    }
    expect((await verifyLiabilities(proofWith().proof, ORDER, unreachable)).verdict).toBe('UNAVAILABLE')
    expect((await verifyLiabilities(proofWith().proof, ORDER, async () => salt)).verdict).toBe('TAMPERED')
  })
})
