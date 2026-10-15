/**
 * Estimated M-Pesa network fee for paying a seller out. The payment provider sets the real fee, and the
 * backend does not expose it yet, so every screen labels this "Estimated". Tiers are tuned to the PAGES.md
 * sample (KES 130 on KES 52,000).
 */
const TIERS: [upTo: number, fee: number][] = [
  [100, 0],
  [1_500, 15],
  [5_000, 30],
  [20_000, 60],
  [50_000, 100],
  [Infinity, 130],
]

export function estimatedNetworkFee(amount: number): number {
  if (amount <= 0) return 0
  return TIERS.find(([upTo]) => amount <= upTo)?.[1] ?? 0
}

/** Gross, fee and net, as every payout surface shows them. */
export function payoutBreakdown(amount: number) {
  const fee = estimatedNetworkFee(amount)
  return { gross: amount, fee, net: Math.max(0, amount - fee) }
}
