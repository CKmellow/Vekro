import { describe, expect, it } from 'vitest'
import { canonicalJson } from './canonical'
import { leafHash, toHex, ZERO_HASH } from './hash'
import { merkleRoot } from './merkle'
import { countVerifiedSales, type SellerTrackRecord } from './trackRecord'

const SELLER = '11111111-2222-4333-8444-555555555555'
const salt = (n: number) => Uint8Array.from({ length: 32 }, () => n)

function sale(seller: string, n: number) {
  const payload = canonicalJson({
    v: 1,
    type: 'seller_sale_completed',
    transaction_id: null,
    at: '2026-11-07T10:00:00Z',
    seller_id: seller,
    sale_ref: 'ab'.repeat(32),
    outcome: 'released',
    amount_band: '1k_5k',
  })
  const prev = Uint8Array.from({ length: 32 }, () => 200 + n)
  return { payload, salt: salt(n), prev, leaf: leafHash(salt(n), prev, payload) }
}

// Two anchored sales in one batch of two, plus one waiting for its batch.
const a = sale(SELLER, 1)
const b = sale(SELLER, 2)
const waiting = sale(SELLER, 3)
const ROOT = merkleRoot([a.leaf, b.leaf])

function event(s: ReturnType<typeof sale>, anchor: SellerTrackRecord['sales'][number]['anchor']) {
  return {
    event_type: 'seller_sale_completed',
    schema_version: 1,
    payload: s.payload,
    salt: toHex(s.salt),
    prev_event_hash: toHex(s.prev),
    leaf_hash: toHex(s.leaf),
    created_at: '2026-11-07T10:00:00Z',
    anchor,
  }
}

const anchorAt = (index: number, sibling: Uint8Array) => ({
  batch_id: 4,
  seq: 10 + index,
  leaf_index: index,
  leaf_count: 2,
  batch_root: toHex(ROOT),
  batch_status: 'confirmed',
  proof: [{ sibling: toHex(sibling), side: index === 0 ? ('right' as const) : ('left' as const) }],
})

function record(sales: SellerTrackRecord['sales']): SellerTrackRecord {
  return {
    seller_id: SELLER,
    chain: { chain_id: 84532, network: 'base-sepolia', registry_address: null },
    completed_sales: 5,
    recorded_sales: sales.length,
    sales,
    server_time: '2026-11-08T09:00:00Z',
  }
}

describe('countVerifiedSales', () => {
  it('counts only proven sales of this seller, and pending ones apart', async () => {
    const result = await countVerifiedSales(
      record([event(a, anchorAt(0, b.leaf)), event(b, anchorAt(1, a.leaf)), event(waiting, null)]),
      async () => ROOT,
    )
    expect(result).toEqual({ verified: 2, pending: 1 })
  })

  it("never counts another seller's sale, an edited one, or one the registry doesn't hold", async () => {
    const other = sale('99999999-2222-4333-8444-555555555555', 4)
    const edited = { ...event(a, anchorAt(0, b.leaf)), payload: a.payload.replace('1k_5k', '100k_plus') }
    expect(
      await countVerifiedSales(
        record([event(other, null), edited, event(b, anchorAt(1, a.leaf))]),
        async () => ROOT,
      ),
    ).toEqual({ verified: 1, pending: 0 })
    expect(await countVerifiedSales(record([event(a, anchorAt(0, b.leaf))]), async () => ZERO_HASH)).toEqual({
      verified: 0,
      pending: 1,
    })
    expect(
      await countVerifiedSales(record([event(a, anchorAt(0, b.leaf))]), async () =>
        new Uint8Array(32).fill(7),
      ),
    ).toEqual({ verified: 0, pending: 0 })
  })
})
