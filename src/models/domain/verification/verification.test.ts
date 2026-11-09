import { describe, expect, it } from 'vitest'
import { canonicalJson, parseCanonical, type Json } from './canonical'
import { fromHex, keccak256, leafHash, toHex } from './hash'
import { merkleRoot, verifyInclusion, type ProofStep } from './merkle'
import vectors from './vectors.json'
import { RegistryUnavailableError, verifyBundle, type VerificationBundle } from './verify'

// The backend's golden vectors (CKmellow/Vekro-backend tests/fixtures/anchoring/vectors.json): the
// browser must agree with the server on every byte, and refuse every must_fail case.
const bytes = (hex: string) => fromHex(hex) as Uint8Array
const proof = (steps: { sibling: string; side: string }[]): ProofStep[] =>
  steps.map((step) => ({ sibling: bytes(step.sibling), side: step.side as 'left' | 'right' }))

describe('golden vectors', () => {
  it('hashes with keccak256, not SHA3-256', () => {
    for (const vector of vectors.keccak) expect(toHex(keccak256(bytes(vector.input_hex)))).toBe(vector.hash)
  })

  it.each(vectors.canonical.map((c) => [c.name, c] as const))('canonical JSON: %s', (_name, vector) => {
    expect(canonicalJson(vector.value as unknown as Json)).toBe(vector.canonical)
    expect(parseCanonical(vector.canonical)).not.toBeNull()
  })

  it('recomputes every event leaf in the chain', () => {
    let prev = new Uint8Array(32)
    for (const event of vectors.events) {
      expect(event.prev_event_hash).toBe(toHex(prev))
      const leaf = leafHash(bytes(event.salt), prev, event.payload)
      expect(toHex(leaf)).toBe(event.leaf_hash)
      prev = leaf
    }
  })

  it('builds every tree root and verifies every proof', () => {
    for (const tree of vectors.trees) {
      const leaves = tree.leaves.map(bytes)
      expect(toHex(merkleRoot(leaves))).toBe(tree.root)
      for (const item of tree.proofs) {
        const leaf = leaves[item.index] as Uint8Array
        expect(verifyInclusion(leaf, proof(item.proof), bytes(tree.root), item.index, tree.size)).toBe(true)
      }
    }
  })

  it.each(vectors.must_fail.map((m) => [m.name, m] as const))('refuses: %s', (_name, vector) => {
    const leaf =
      'payload' in vector && typeof vector.payload === 'string'
        ? leafHash(
            bytes(vectors.events[2]?.salt ?? ''),
            bytes(vectors.events[2]?.prev_event_hash ?? ''),
            vector.payload,
          )
        : bytes(vector.leaf)
    expect(verifyInclusion(leaf, proof(vector.proof), bytes(vector.root), vector.index, vector.size)).toBe(
      false,
    )
  })

  it('rejects text that is not exactly canonical', () => {
    expect(parseCanonical('{"b":1,"a":2}')).toBeNull()
    expect(parseCanonical('{"a": 2}')).toBeNull()
    expect(parseCanonical('{"a":1.5}')).toBeNull()
    expect(parseCanonical('[1]')).toBeNull()
    expect(parseCanonical('not json')).toBeNull()
  })
})

// A bundle shaped like GET /transactions/{id}/verification, built from the vectors' chain anchored
// as one batch of eight.
const tree = vectors.trees.find((t) => t.size === vectors.events.length) as (typeof vectors.trees)[number]
const created = JSON.parse(vectors.events[0]?.payload ?? '{}') as { transaction_id: string; amount: string }

function bundle(): VerificationBundle {
  return {
    version: 1,
    transaction_id: created.transaction_id,
    reference: 'VK-7K3P9Q',
    chain: { chain_id: 84532, network: 'base-sepolia', registry_address: null },
    current: { status: 'resolved_split', amount: created.amount },
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
        leaf_count: tree.size,
        batch_root: tree.root,
        batch_status: 'confirmed',
        tx_hash: null,
        block_number: 12,
        proof: tree.proofs.find((p) => p.index === index)?.proof as {
          sibling: string
          side: 'left' | 'right'
        }[],
      },
    })),
    linked_events: [],
    server_time: '2026-11-08T09:00:00Z',
  }
}

const onChain = (root: string) => async () => bytes(root)
const zero = async () => new Uint8Array(32)

describe('verifyBundle', () => {
  it('verifies an intact, anchored order', async () => {
    const report = await verifyBundle(bundle(), onChain(tree.root))
    expect(report).toEqual({ verdict: 'VERIFIED', findings: [], anchored: 8, pending: 0, total: 8 })
  })

  it('reads each batch root from the registry once', async () => {
    let reads = 0
    await verifyBundle(bundle(), async () => {
      reads += 1
      return bytes(tree.root)
    })
    expect(reads).toBe(1)
  })

  it('is partially pending while the registry has no root, or an event has no batch', async () => {
    expect((await verifyBundle(bundle(), zero)).verdict).toBe('PARTIALLY_PENDING')
    const last = bundle()
    const tail = last.events[7]
    if (tail) tail.anchor = null
    const report = await verifyBundle(last, onChain(tree.root))
    expect([report.verdict, report.anchored, report.pending]).toEqual(['PARTIALLY_PENDING', 7, 1])
  })

  it('catches an edited payload', async () => {
    const edited = bundle()
    const ledger = edited.events[2]
    if (ledger) ledger.payload = ledger.payload.replace('"amount":"', '"amount":"9')
    const report = await verifyBundle(edited, onChain(tree.root))
    expect(report.verdict).toBe('TAMPERED')
    expect(report.findings).toContainEqual({ code: 'leaf_mismatch', eventIndex: 2 })
  })

  it('catches a deleted event in the middle of the chain', async () => {
    const gapped = bundle()
    gapped.events.splice(3, 1)
    const report = await verifyBundle(gapped, onChain(tree.root))
    expect(report.verdict).toBe('TAMPERED')
    expect(report.findings).toContainEqual({ code: 'chain_broken', eventIndex: 3 })
  })

  it('catches a different root on chain and a live status that moved', async () => {
    const forged = await verifyBundle(bundle(), onChain(`0x${'05'.repeat(32)}`))
    expect(forged.findings.map((f) => f.code)).toEqual(Array(8).fill('root_mismatch'))

    const moved = bundle()
    moved.current.status = 'released'
    const report = await verifyBundle(moved, onChain(tree.root))
    expect([report.verdict, report.findings]).toEqual(['TAMPERED', [{ code: 'status_mismatch' }]])
  })

  it('refuses a proof for another position', async () => {
    const swapped = bundle()
    const first = swapped.events[0]
    if (first?.anchor) first.anchor.leaf_index = 1
    const report = await verifyBundle(swapped, onChain(tree.root))
    expect(report.findings).toContainEqual({ code: 'proof_invalid', eventIndex: 0 })
  })

  it('is unavailable when the registry cannot be read, or nothing is recorded', async () => {
    const down = async (): Promise<Uint8Array> => {
      throw new RegistryUnavailableError('RPC down')
    }
    expect((await verifyBundle(bundle(), down)).verdict).toBe('UNAVAILABLE')
    expect((await verifyBundle({ ...bundle(), events: [] }, down)).verdict).toBe('UNAVAILABLE')
  })

  it('requires a linked provider event to be present', async () => {
    const linked = bundle()
    linked.events = linked.events.slice(0, 1)
    linked.events.push({
      ...(linked.events[0] as VerificationBundle['events'][number]),
      payload: canonicalJson({
        v: 1,
        type: 'global_event_linked',
        transaction_id: created.transaction_id,
        global_leaf_hash: `0x${'aa'.repeat(32)}`,
      }),
      anchor: null,
    })
    const report = await verifyBundle(linked, onChain(tree.root))
    expect(report.findings.map((f) => f.code)).toContain('linked_missing')
  })
})
