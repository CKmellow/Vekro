/**
 * The page to go back to after logging in. Only same-site paths are allowed, so a crafted
 * `?returnTo=https://evil.example` link cannot bounce a seller off Vekro after they log in.
 */
export function safeReturnTo(raw: string | null | undefined, fallback: string): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return fallback
  try {
    const url = new URL(raw, 'https://vekro.invalid')
    if (url.origin !== 'https://vekro.invalid') return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
