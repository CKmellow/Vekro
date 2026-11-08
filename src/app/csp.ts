/**
 * Content Security Policy for the built app (M16 #130). Everything is same-origin: self-hosted fonts,
 * the API under /api, photos and logos from the API, blob: for logo and photo previews. Injected as a
 * <meta> tag at build time (vite.config.ts); the deployment should also send it as a header, with
 * frame-ancestors, which a meta tag can't carry.
 */
export const CSP_DIRECTIVES: Record<string, string[]> = {
  'default-src': ["'self'"],
  'script-src': ["'self'"],
  // React and motion set inline style attributes.
  'style-src': ["'self'", "'unsafe-inline'"],
  'img-src': ["'self'", 'data:', 'blob:'],
  'font-src': ["'self'"],
  'connect-src': ["'self'"],
  'worker-src': ["'self'"],
  'manifest-src': ["'self'"],
  'object-src': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
}

/**
 * The policy for a build. The anchoring RPC (VITE_ANCHOR_RPC_URL, the "Verified record" panel) is
 * the one cross-origin request the app makes, so its origin joins connect-src when it is set.
 */
export function cspFor(anchorRpcUrl?: string): string {
  let rpcOrigin: string | null = null
  try {
    rpcOrigin = anchorRpcUrl ? new URL(anchorRpcUrl).origin : null
  } catch {
    rpcOrigin = null
  }
  return Object.entries(CSP_DIRECTIVES)
    .map(([name, values]) => {
      const all = name === 'connect-src' && rpcOrigin ? [...values, rpcOrigin] : values
      return `${name} ${all.join(' ')}`
    })
    .join('; ')
}

export const CSP = cspFor()

/** Header-only additions for the deployment (M17 #134). */
export const CSP_HEADER = `${CSP}; frame-ancestors 'none'; upgrade-insecure-requests`
