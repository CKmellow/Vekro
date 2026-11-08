import { fromHex } from '@/models/domain/verification/hash'
import { RegistryUnavailableError, type RootOf } from '@/models/domain/verification/verify'

/**
 * The public AnchorRegistry, read over JSON-RPC (backend docs/frontend-verification-contract.md).
 * Chain, address and RPC are fixed at build time (VITE_ANCHOR_*), never taken from the API: a server
 * that could pick the registry could pick its own roots.
 */
export interface RegistryConfig {
  chainId: number
  address: string
  rpcUrl: string
  /** Block explorer for transaction links, when the chain has one. */
  explorer: string | null
}

const EXPLORERS: Record<number, string> = {
  84532: 'https://sepolia.basescan.org',
  8453: 'https://basescan.org',
}
const ROOT_OF = '0xdc299d69' // rootOf(uint256)

export function registryConfig(
  env: Record<string, string | undefined> = import.meta.env,
): RegistryConfig | null {
  const chainId = Number(env.VITE_ANCHOR_CHAIN_ID)
  const address = env.VITE_ANCHOR_REGISTRY_ADDRESS ?? ''
  const rpcUrl = env.VITE_ANCHOR_RPC_URL ?? ''
  if (!Number.isInteger(chainId) || chainId <= 0 || !/^0x[0-9a-fA-F]{40}$/.test(address) || !rpcUrl)
    return null
  return { chainId, address: address.toLowerCase(), rpcUrl, explorer: EXPLORERS[chainId] ?? null }
}

async function rpc(config: RegistryConfig, method: string, params: unknown[]): Promise<string> {
  let response: Response
  try {
    response = await fetch(config.rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    })
  } catch {
    throw new RegistryUnavailableError('The registry could not be reached.')
  }
  const body = (await response.json().catch(() => null)) as { result?: unknown } | null
  if (!response.ok || typeof body?.result !== 'string')
    throw new RegistryUnavailableError(`The registry answered ${response.status}.`)
  return body.result
}

/** `rootOf(batchId)` on the pinned registry, after checking the RPC is on the pinned chain. */
export function createRootReader(config: RegistryConfig): RootOf {
  let chainChecked: Promise<void> | null = null
  const checkChain = () => {
    chainChecked ??= rpc(config, 'eth_chainId', []).then((hex) => {
      if (Number.parseInt(hex, 16) !== config.chainId) throw new RegistryUnavailableError('Wrong chain.')
    })
    return chainChecked
  }
  return async (batchId: number) => {
    await checkChain()
    const data = `${ROOT_OF}${batchId.toString(16).padStart(64, '0')}`
    const result = fromHex(await rpc(config, 'eth_call', [{ to: config.address, data }, 'latest']))
    if (!result || result.length !== 32) throw new RegistryUnavailableError('Unexpected registry answer.')
    return result
  }
}
