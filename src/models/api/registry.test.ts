import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { RegistryUnavailableError } from '@/models/domain/verification/verify'
import { server } from '@/test/server'
import { createRootReader, registryConfig } from './registry'

const RPC = 'https://rpc.test/'
const ADDRESS = '0x5FbDB2315678afecb367f032d93F642f64180aa3'
const ROOT = `0x${'ab'.repeat(32)}`

describe('registryConfig', () => {
  it('needs all three settings, and a real address', () => {
    expect(
      registryConfig({
        VITE_ANCHOR_CHAIN_ID: '84532',
        VITE_ANCHOR_REGISTRY_ADDRESS: ADDRESS,
        VITE_ANCHOR_RPC_URL: RPC,
      }),
    ).toEqual({
      chainId: 84532,
      address: ADDRESS.toLowerCase(),
      rpcUrl: RPC,
      explorer: 'https://sepolia.basescan.org',
    })
    expect(registryConfig({})).toBeNull()
    expect(
      registryConfig({
        VITE_ANCHOR_CHAIN_ID: '84532',
        VITE_ANCHOR_REGISTRY_ADDRESS: '0x12',
        VITE_ANCHOR_RPC_URL: RPC,
      }),
    ).toBeNull()
  })
})

describe('createRootReader', () => {
  const config = { chainId: 84532, address: ADDRESS.toLowerCase(), rpcUrl: RPC, explorer: null }

  it('checks the chain once, then reads rootOf(batch) with eth_call', async () => {
    const calls: { method: string; params: unknown[] }[] = []
    server.use(
      http.post(RPC, async ({ request }) => {
        const body = (await request.json()) as { method: string; params: unknown[] }
        calls.push(body)
        return HttpResponse.json({
          jsonrpc: '2.0',
          id: 1,
          result: body.method === 'eth_chainId' ? '0x14a34' : ROOT,
        })
      }),
    )
    const rootOf = createRootReader(config)
    expect(await rootOf(1)).toEqual(Uint8Array.from({ length: 32 }, () => 0xab))
    await rootOf(2)
    expect(calls.map((c) => c.method)).toEqual(['eth_chainId', 'eth_call', 'eth_call'])
    expect(calls[1]?.params).toEqual([
      { to: ADDRESS.toLowerCase(), data: `0xdc299d69${'0'.repeat(63)}1` },
      'latest',
    ])
  })

  it('refuses an RPC on another chain, and reports an unreachable one', async () => {
    server.use(http.post(RPC, () => HttpResponse.json({ jsonrpc: '2.0', id: 1, result: '0x1' })))
    await expect(createRootReader(config)(1)).rejects.toBeInstanceOf(RegistryUnavailableError)
    server.use(http.post(RPC, () => HttpResponse.error()))
    await expect(createRootReader(config)(1)).rejects.toBeInstanceOf(RegistryUnavailableError)
    server.use(http.post(RPC, () => HttpResponse.json({ error: { message: 'boom' } }, { status: 500 })))
    await expect(createRootReader(config)(1)).rejects.toBeInstanceOf(RegistryUnavailableError)
  })
})
