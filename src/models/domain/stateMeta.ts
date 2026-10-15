import type { LockRingState, StatusIcon, StatusView, Tone } from '@/lib/status'
import type { components } from '@/models/api/schema'

export type TransactionStatus = components['schemas']['TransactionStatus']
export type ViewerRole = 'buyer' | 'seller' | 'admin'

export interface StateMeta {
  buyerLabel: string
  sellerLabel: string
  tone: Tone
  icon: StatusIcon
  ring: LockRingState
  /** No further money movement: polling can stop. */
  final: boolean
  /** Legacy value the current state machine never sets; never offer actions for it. */
  legacy?: true
}

const meta = (
  buyerLabel: string,
  sellerLabel: string,
  tone: Tone,
  icon: StatusIcon,
  ring: LockRingState,
  final = false,
): StateMeta => ({ buyerLabel, sellerLabel, tone, icon, ring, final })

const awaitingPayment = meta('Waiting for payment', 'Buyer is paying', 'saffron', 'clock', 'open')
const onTheWay = meta('On the way', 'On the way', 'lake', 'truck', 'locked')
const complete = meta('Complete, seller paid', 'Paid out', 'emerald', 'check', 'released', true)

/**
 * Every backend TransactionStatus mapped to human labels (PAGES.md 0.2 with the operating prompt 4.3 mapping).
 * The backend enum is the authority; raw values are never shown.
 */
export const STATE_META: Record<TransactionStatus, StateMeta> = {
  initiated: awaitingPayment,
  awaiting_payment: awaitingPayment,
  locked: meta('Paid, funds held safely', 'Paid, ready to dispatch', 'emerald', 'lock', 'locked'),
  out_for_delivery: onTheWay,
  dispatched: { ...onTheWay, legacy: true },
  at_door_pending_inspection: meta(
    'At your door, inspect now',
    'Buyer is inspecting',
    'saffron',
    'eye',
    'pulse',
  ),
  hold_24h: meta('Held 24 hours for checks', 'Held 24 hours', 'saffron', 'hourglass', 'draining'),
  disputed_functional: meta('Issue reported', 'Issue reported', 'coral', 'alert', 'coral'),
  return_in_transit: meta('Item on its way back', 'Waiting for item to arrive', 'lake', 'truck', 'lake'),
  return_received: meta('Seller has your item', 'Item received', 'lake', 'box', 'lake'),
  awaiting_buyer_reconfirmation: meta(
    'Is it fixed?',
    'Waiting for buyer to confirm',
    'saffron',
    'question',
    'pulse',
  ),
  escalated_admin_review: meta('With Vekro support', 'With Vekro support', 'plum', 'shield', 'plum'),
  returned_to_seller: meta('Returned to seller', 'Item returned to you', 'coral', 'undo', 'returned', true),
  released: complete,
  refunded_buyer: meta('Refunded', 'Refunded to buyer', 'emerald', 'coin', 'refunded', true),
  resolved_release: complete,
  resolved_refund: meta('Refund issued', 'Refund issued', 'emerald', 'coin', 'refunded', true),
  resolved_split: meta('Settled by Vekro support', 'Settled by Vekro support', 'plum', 'scale', 'plum', true),
}

/** What a status pill shows for this viewer. Admins read the seller wording. */
export function statusView(status: TransactionStatus, role: ViewerRole): StatusView {
  const m = STATE_META[status]
  return { label: role === 'buyer' ? m.buyerLabel : m.sellerLabel, tone: m.tone, icon: m.icon }
}
