/**
 * RFC 8785 JSON Canonicalization for the values anchored payloads hold (backend
 * app/services/anchoring/canonical.py): objects with keys sorted by UTF-16 code units, no
 * whitespace, strings escaped exactly as JSON.stringify does (lowercase \u00xx), integers only.
 */
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json }

export function canonicalJson(value: Json): string {
  if (value === null || typeof value === 'boolean') return JSON.stringify(value)
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value)) throw new Error('Anchored payloads carry safe integers only.')
    return String(value)
  }
  if (typeof value === 'string') return JSON.stringify(value)
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  // Array.prototype.sort without a comparator compares UTF-16 code units, as RFC 8785 requires.
  const keys = Object.keys(value).sort()
  return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key] as Json)}`).join(',')}}`
}

/** The parsed payload when the text is exactly its canonical form, otherwise null. */
export function parseCanonical(payload: string): { [key: string]: Json } | null {
  try {
    const parsed = JSON.parse(payload) as Json
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return null
    return canonicalJson(parsed) === payload ? parsed : null
  } catch {
    return null
  }
}
