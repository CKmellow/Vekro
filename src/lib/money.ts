const kes = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 2, minimumFractionDigits: 0 })

/** Formats an amount as "KES 52,000". Accepts the API's decimal strings. Decimals only when non-zero. */
export function formatKes(amount: number | string): string {
  const value = typeof amount === 'string' ? Number(amount) : amount
  if (!Number.isFinite(value)) throw new RangeError(`Not an amount: ${String(amount)}`)
  return `KES ${kes.format(value)}`
}
