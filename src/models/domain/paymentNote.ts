import type { Collection } from './order'
import type { TransactionStatus } from './stateMeta'

const RAIL_NAMES: Record<Collection['rail'], string> = {
  simulated: "Vekro's simulator",
  daraja: 'M-Pesa',
  pesapal: 'Pesapal',
  econfirm: 'eConfirm',
}

const UNPAID: ReadonlySet<TransactionStatus> = new Set(['initiated', 'awaiting_payment'])

/**
 * What the order says about its money (backend #257). Sandbox payments are always called tests.
 * A live payment is described once it is paid, and never as third-party escrow: Daraja and Pesapal
 * collect into the merchant's account.
 */
export function paymentNote(order: { collection: Collection; status: TransactionStatus }): string | null {
  const { rail, mode } = order.collection
  if (mode === 'sandbox')
    return rail === 'simulated'
      ? "Test payment via Vekro's simulator: no real money moves."
      : `Test payment via ${RAIL_NAMES[rail]} sandbox: no real money moves.`
  if (UNPAID.has(order.status)) return null
  return `Paid via ${RAIL_NAMES[rail]}. Held by Vekro's payment partner until delivery.`
}

/**
 * Who holds the money on the money path. Card money is collected into Pesapal's account, so a card
 * order never says "Vekro vault" (#290); like `paymentNote`, never third-party escrow.
 */
export function moneyHolder(rail: Collection['rail']): string {
  return rail === 'pesapal' ? 'Held by Pesapal' : 'Vekro vault'
}

/** B2's line under the amount while the buyer pays. */
export function payingHint(rail: Collection['rail']): string {
  return rail === 'pesapal'
    ? 'Your card payment will be held by Pesapal, not paid to the seller.'
    : 'Your money goes into the Vekro vault, not to the seller.'
}
