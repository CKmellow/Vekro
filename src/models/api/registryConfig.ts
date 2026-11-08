/**
 * The registry the browser checks against, fixed at build time (VITE_ANCHOR_*). Kept apart from the
 * reader (registry.ts) so pages can ask "is verification on?" without loading the hashing code.
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
