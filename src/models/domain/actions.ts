import type { Order } from './order'
import type { TransactionStatus, ViewerRole } from './stateMeta'

/** What a person may do next. Each one maps to one backend endpoint; the backend stays the authority. */
export type OrderAction =
  | 'pay' // B2: POST /transactions/{id}/payment/resend
  | 'accept_with_code' // B4: otp-give
  | 'reject_at_door' // B4: otp-withhold
  | 'report_problem' // B5: report-functional-issue
  | 'mark_sent_back' // B6: buyer-sent-back
  | 'reconfirm' // B6: buyer-reconfirmation
  | 'dispatch' // S6: dispatch
  | 'mark_arrived' // S6: arrival
  | 'confirm_return_received' // S11: seller-received
  | 'choose_resolution' // S11: seller-resolution-action
  | 'confirm_resolved' // B6, S11: confirm-resolved-buyer / confirm-resolved-seller

/**
 * Mirrors the state guards in the backend's transaction service. `dispatched` is legacy and gets
 * nothing. Admins act through the dispute endpoints (A3), not these. The mutual "confirm resolved"
 * closure applies only to resolved_* cases with a dispute, and only until that side has confirmed.
 */
const TABLE: Partial<Record<TransactionStatus, Partial<Record<ViewerRole, OrderAction[]>>>> = {
  initiated: { buyer: ['pay'] },
  awaiting_payment: { buyer: ['pay'] },
  locked: { seller: ['dispatch'] },
  out_for_delivery: { seller: ['mark_arrived'] },
  at_door_pending_inspection: { buyer: ['accept_with_code', 'reject_at_door'] },
  hold_24h: { buyer: ['report_problem'] },
  disputed_functional: { buyer: ['mark_sent_back'] },
  return_in_transit: { seller: ['confirm_return_received'] },
  return_received: { seller: ['choose_resolution'] },
  awaiting_buyer_reconfirmation: { buyer: ['reconfirm'] },
}

const RESOLVED: TransactionStatus[] = ['resolved_release', 'resolved_refund', 'resolved_split']

export function getAvailableActions(
  role: ViewerRole,
  order: Pick<Order, 'status'> & Partial<Pick<Order, 'dispute'>>,
): OrderAction[] {
  const dispute = order.dispute
  if (dispute && RESOLVED.includes(order.status) && role !== 'admin') {
    const confirmed = role === 'buyer' ? dispute.buyerConfirmedResolved : dispute.sellerConfirmedResolved
    return confirmed ? [] : ['confirm_resolved']
  }
  return TABLE[order.status]?.[role] ?? []
}
