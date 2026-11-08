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
