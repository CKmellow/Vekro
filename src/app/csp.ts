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

/** The header for a build: the same policy plus what a meta tag can't carry (M17 #134). */
export function cspHeaderFor(anchorRpcUrl?: string): string {
  return `${cspFor(anchorRpcUrl)}; frame-ancestors 'none'; upgrade-insecure-requests`
}

export const CSP_HEADER = cspHeaderFor()

/** Where deploy/nginx.conf.template takes the header (#294). */
export const CSP_HEADER_PLACEHOLDER = '__CSP_HEADER__'

/**
 * The nginx template with this build's CSP header filled in (#294). The build writes it to
 * .deploy/default.conf.template and the web image serves it, so the header always matches the
 * <meta> CSP, RPC origin included.
 */
export function renderNginxTemplate(template: string, anchorRpcUrl?: string): string {
  return template.split(CSP_HEADER_PLACEHOLDER).join(cspHeaderFor(anchorRpcUrl))
}
