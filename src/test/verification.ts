import { canonicalJson } from '@/models/domain/verification/canonical'
import { keccak256, leafHash, toHex } from '@/models/domain/verification/hash'
import { orderCommit, sumLeaf } from '@/models/domain/verification/sumTree'
import vectors from '@/models/domain/verification/vectors.json'

/** The backend's golden-vector chain as a GET /transactions/{id}/verification bundle in one batch. */
export const verificationTree = vectors.trees.find(
  (t) => t.size === vectors.events.length,
) as (typeof vectors.trees)[number]
const created = JSON.parse(vectors.events[0]?.payload ?? '{}') as { transaction_id: string; amount: string }
export const VERIFIED_ORDER = created.transaction_id

export function verificationBundle(status = 'resolved_split', overrides: Record<string, unknown> = {}) {
  return {
    version: 1,
    transaction_id: created.transaction_id,
    reference: 'VK-7K3P9Q',
    chain: { chain_id: 84532, network: 'base-sepolia', registry_address: null },
    current: { status, amount: created.amount },
    events: vectors.events.map((event, index) => ({
      event_type: event.event_type,
      schema_version: 1,
      payload: event.payload,
      salt: event.salt,
      prev_event_hash: event.prev_event_hash,
      leaf_hash: event.leaf_hash,
      created_at: '2026-10-31T09:00:00Z',
      anchor: {
        batch_id: 1,
        seq: index + 1,
        leaf_index: index,
        leaf_count: verificationTree.size,
        batch_root: verificationTree.root,
        batch_status: 'confirmed',
        tx_hash: `0x${'cd'.repeat(32)}`,
        block_number: 12,
        proof: verificationTree.proofs.find((p) => p.index === index)?.proof ?? [],
      },
    })),
    linked_events: [],
    server_time: '2026-11-08T09:00:00Z',
    ...overrides,
  }
}

/**
 * A one-order liabilities snapshot holding KES 6,500 for `orderId`, anchored alone in `batchId`
 * (so the batch root is the event's leaf). `total` is what the anchored payload claims.
 */
export function liabilitiesProof(orderId: string, batchId: number, total = '6500.00') {
  const salt = keccak256(Uint8Array.of(1))
  const prev = keccak256(Uint8Array.of(2))
  const commit = orderCommit(orderId)
  const root = { hash: toHex(sumLeaf(salt, commit, 650000n).hash), sum: '650000' }
  const payload = canonicalJson({
    v: 1,
    type: 'liabilities_snapshot',
    transaction_id: null,
    at: '2026-11-09T08:00:00.000000Z',
    snapshot_id: 1,
    root: root.hash,
    total,
    leaf_count: 1,
  })
  const eventLeaf = toHex(leafHash(salt, prev, payload))
  const proof = {
    snapshot_id: 1,
    created_at: '2026-11-09T08:00:00Z',
    root,
    total: '6500.00',
    leaf_count: 1,
    leaf: { salt: toHex(salt), order_commit: toHex(commit), amount_cents: '650000' },
    proof: [],
    anchor: {
      event_type: 'liabilities_snapshot',
      schema_version: 1,
      payload,
      salt: toHex(salt),
      prev_event_hash: toHex(prev),
      leaf_hash: eventLeaf,
      created_at: '2026-11-09T08:00:00Z',
      anchor: {
        batch_id: batchId,
        leaf_index: 0,
        leaf_count: 1,
        proof: [],
        tx_hash: null,
        block_number: null,
      },
    },
  }
  return { proof, batchRoot: eventLeaf }
}
