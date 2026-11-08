import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it, vi } from 'vitest'
import { canonicalJson } from '@/models/domain/verification/canonical'
import { leafHash, toHex } from '@/models/domain/verification/hash'
import { renderHookWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { useVerifiedSales } from './trackRecord'

vi.mock('@/models/api/registryConfig', async (original) => ({
  ...(await original<object>()),
  registryConfig: () => ({
    chainId: 84532,
    address: `0x${'5f'.repeat(20)}`,
    rpcUrl: 'https://rpc.test/',
    explorer: null,
  }),
}))

const SELLER = '11111111-2222-4333-8444-555555555555'
const payload = canonicalJson({
  v: 1,
  type: 'seller_sale_completed',
  transaction_id: null,
  at: '2026-11-07T10:00:00Z',
  seller_id: SELLER,
  sale_ref: 'cd'.repeat(32),
  outcome: 'released',
  amount_band: 'under_1k',
})
const salt = new Uint8Array(32).fill(1)
const prev = new Uint8Array(32).fill(2)
const leaf = leafHash(salt, prev, payload)

describe('useVerifiedSales', () => {
  it('counts the sales the registry proves, for this seller', async () => {
    server.use(
      http.get(`/api/sellers/${SELLER}/track-record`, () =>
        HttpResponse.json({
          seller_id: SELLER,
          chain: { chain_id: 84532, network: 'base-sepolia', registry_address: null },
          completed_sales: 1,
          recorded_sales: 1,
          server_time: '2026-11-08T09:00:00Z',
          sales: [
            {
              event_type: 'seller_sale_completed',
              schema_version: 1,
              payload,
              salt: toHex(salt),
              prev_event_hash: toHex(prev),
              leaf_hash: toHex(leaf),
              created_at: '2026-11-07T10:00:00Z',
              // A batch of one: the root is the leaf and the proof is empty.
              anchor: {
                batch_id: 3,
                seq: 7,
                leaf_index: 0,
                leaf_count: 1,
                batch_root: toHex(leaf),
                batch_status: 'confirmed',
                proof: [],
              },
            },
          ],
        }),
      ),
      http.post('https://rpc.test/', async ({ request }) => {
        const { method } = (await request.json()) as { method: string }
        return HttpResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: method === 'eth_chainId' ? '0x14a34' : toHex(leaf),
        })
      }),
    )
    const { result } = renderHookWithProviders(() => useVerifiedSales(SELLER))
    await waitFor(() => expect(result.current.data).toEqual({ verified: 1, pending: 0 }))
  })

  it('waits for a seller id', () => {
    const { result } = renderHookWithProviders(() => useVerifiedSales(undefined))
    expect(result.current.fetchStatus).toBe('idle')
  })
})
