import type {
  CreatedOrder,
  DisputeCategory,
  Order,
  OrderDeadlines,
  OrderList,
  OrderListFilter,
  OrderSummary,
  PaymentInstruction,
  SellerSummary,
} from '@/models/domain/order'
import type { TransactionStatus } from '@/models/domain/stateMeta'
import { photoUrl, toPolicy } from './adapters/listings'
import { api, type Schemas } from './client'

type PaymentResponse = Schemas['PaymentInstructionResponse']
type DetailResponse = Schemas['TransactionDetailResponse']
type SummaryResponse = Schemas['TransactionSummaryResponse']

const toDeadlines = (raw: Schemas['TransactionDeadlinesResponse']): OrderDeadlines => ({
  dispatchBy: raw.dispatch_by ?? null,
  inspectBy: raw.inspect_by ?? null,
  holdUntil: raw.hold_until ?? null,
  returnSendBy: raw.return_send_by ?? null,
  returnConfirmBy: raw.return_confirm_by ?? null,
})

/**
 * The payment instruction as screens use it (FRONTEND_CONTRACT B). The kind is explicit in the contract;
 * a REDIRECT without a URL cannot be followed, so it is treated as a prompt that failed to start.
 */
export function toPaymentInstruction(raw: PaymentResponse): PaymentInstruction {
  const redirect = raw.kind === 'REDIRECT' && raw.redirect_url ? raw.redirect_url : undefined
  const broken = raw.kind === 'REDIRECT' && !redirect
  return {
    kind: broken ? 'STK_PROMPT' : raw.kind,
    ...(redirect ? { redirectUrl: redirect } : {}),
    status: broken ? 'failed_to_initiate' : raw.status,
    failureReason: raw.failure_reason ?? null,
    sentAt: raw.sent_at,
    expiresAt: raw.expires_at,
    resendAvailableAt: raw.resend_available_at,
  }
}

/** `receivedAt` is the device time the response arrived, for the server clock offset. */
export function toOrder(raw: DetailResponse, receivedAt = Date.now()): Order {
  return {
    id: raw.id,
    reference: raw.reference,
    status: raw.status,
    amount: Number(raw.amount),
    viewerRole: raw.viewer_role,
    simulated: raw.custody_provider === 'simulated',
    listing: {
      id: raw.listing.id,
      title: raw.listing.title,
      price: Number(raw.listing.price),
      isSerialized: raw.listing.is_serialized,
      policy: toPolicy(raw.listing.dispute_policy),
    },
    buyer: { name: raw.buyer.name, phoneMasked: raw.buyer.phone_masked },
    seller: { name: raw.seller.name, phoneMasked: raw.seller.phone_masked },
    deadlines: toDeadlines(raw.deadlines),
    serverOffsetMs: new Date(raw.server_time).getTime() - receivedAt,
    payment: raw.payment ? toPaymentInstruction(raw.payment) : null,
    payout: raw.payout
      ? {
          status: raw.payout.status,
          amount: raw.payout.amount == null ? null : Number(raw.payout.amount),
          reference: raw.payout.reference ?? null,
          paidAt: raw.payout.paid_at ?? null,
        }
      : null,
    dispute: raw.dispute
      ? {
          id: raw.dispute.id,
          status: raw.dispute.status,
          category: raw.dispute.category,
          description: raw.dispute.description,
          openedAt: raw.dispute.opened_at,
          escalatedAt: raw.dispute.escalated_at ?? null,
          resolvedAt: raw.dispute.resolved_at ?? null,
          sellerAction: raw.dispute.seller_action ?? null,
          sellerNotes: raw.dispute.seller_notes ?? null,
          buyerNotes: raw.dispute.buyer_notes ?? null,
          reconfirmRejections: raw.dispute.reconfirm_rejections,
          buyerConfirmedResolved: raw.dispute.buyer_confirmed_resolved,
          sellerConfirmedResolved: raw.dispute.seller_confirmed_resolved,
        }
      : null,
    doorRejection: raw.door_rejection
      ? { reason: raw.door_rejection.reason ?? null, note: raw.door_rejection.note ?? null }
      : null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

export function toOrderSummary(raw: SummaryResponse): OrderSummary {
  return {
    id: raw.id,
    reference: raw.reference,
    status: raw.status,
    amount: Number(raw.amount),
    viewerRole: raw.viewer_role,
    listing: {
      id: raw.listing.id,
      title: raw.listing.title,
      isSerialized: raw.listing.is_serialized,
      photoUrl: raw.listing.photo_url ? photoUrl(raw.listing.photo_url) : null,
    },
    counterpart: { name: raw.counterpart.name, phoneMasked: raw.counterpart.phone_masked },
    deadlines: toDeadlines(raw.deadlines),
    disputeCategory: raw.dispute_category ?? null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  }
}

/** GET /transactions: the caller's own orders (bought or sold). Counts cover all of them, before filters. */
export async function listOrders(filter: OrderListFilter = {}, signal?: AbortSignal): Promise<OrderList> {
  const raw = await api.get('/transactions', {
    query: {
      segment: filter.segment,
      status: filter.statuses,
      q: filter.q?.trim() || undefined,
      sort: filter.sort,
      page: filter.page,
      page_size: filter.pageSize,
    },
    signal,
  })
  const receivedAt = Date.now()
  return {
    items: raw.items.map(toOrderSummary),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
    segmentCounts: raw.counts,
    statusCounts: raw.status_counts as Partial<Record<TransactionStatus, number>>,
    serverOffsetMs: new Date(raw.server_time).getTime() - receivedAt,
  }
}

/** GET /transactions/summary: the seller dashboard totals. */
export async function getSellerSummary(signal?: AbortSignal): Promise<SellerSummary> {
  const raw = await api.get('/transactions/summary', { signal })
  const total = (t: { amount: string; orders: number }) => ({ amount: Number(t.amount), orders: t.orders })
  return {
    inEscrow: total(raw.in_escrow),
    releasedThisMonth: total(raw.released_this_month),
    releasedLastMonth: total(raw.released_last_month),
    awaitingDispatch: raw.awaiting_dispatch,
    openIssues: raw.open_issues,
    nextRelease: raw.next_release ?? null,
  }
}

/** GET /transactions/{id}: for the buyer, the seller or an admin; anyone else gets not_found. */
export async function getOrder(id: string, signal?: AbortSignal): Promise<Order> {
  const raw = await api.get('/transactions/{transaction_id}', { path: { transaction_id: id }, signal })
  return toOrder(raw)
}

/**
 * Starts the escrow payment for a listing. The amount is never sent: the server takes the listing price
 * (contract B). A 202 (the prompt failed to start) still returns the order, with a failed_to_initiate payment.
 */
export async function createOrder(listingId: string): Promise<CreatedOrder> {
  const raw = await api.post('/transactions', { body: { listing_id: listingId } })
  return {
    id: raw.id,
    reference: raw.reference,
    status: raw.status,
    payment: toPaymentInstruction(raw.payment),
  }
}

/** Sends a new STK prompt. Rejects with kind `rate_limited` (and `retryAfterSeconds`) inside the cooldown. */
export async function resendPayment(orderId: string): Promise<PaymentInstruction> {
  const raw = await api.post('/transactions/{transaction_id}/payment/resend', {
    path: { transaction_id: orderId },
  })
  return toPaymentInstruction(raw)
}

/** B4 accept: the buyer types the code they received (contract C). A wrong code is a 422. */
export async function giveDeliveryCode(orderId: string, code: string): Promise<void> {
  await api.post('/transactions/{transaction_id}/otp-give', {
    path: { transaction_id: orderId },
    body: { otp_code: code },
  })
}

/** B4 reject: withhold the code; the item goes back and the buyer is refunded. */
export async function rejectAtDoor(
  orderId: string,
  reason: string | null,
  note: string | null,
): Promise<void> {
  await api.post('/transactions/{transaction_id}/otp-withhold', {
    path: { transaction_id: orderId },
    body: reason || note ? { reason, note } : null,
  })
}

/** S6: the courier has the item (locked to out_for_delivery). Seller only; 409 if the state moved on. */
export async function dispatchOrder(orderId: string): Promise<void> {
  await api.post('/transactions/{transaction_id}/dispatch', { path: { transaction_id: orderId } })
}

/** S6: the courier is at the buyer's door (out_for_delivery to at_door_pending_inspection). Seller only. */
export async function markArrived(orderId: string): Promise<void> {
  await api.post('/transactions/{transaction_id}/arrival', { path: { transaction_id: orderId } })
}

/** B5: report a functional problem during the 24-hour hold (serialized items only). */
export async function reportIssue(
  orderId: string,
  category: DisputeCategory,
  description: string,
): Promise<void> {
  await api.post('/transactions/{transaction_id}/report-functional-issue', {
    path: { transaction_id: orderId },
    body: { category, description, evidence: {} },
  })
}

/** B6: the buyer has sent the item back. */
export async function markSentBack(orderId: string): Promise<void> {
  await api.post('/transactions/{transaction_id}/buyer-sent-back', { path: { transaction_id: orderId } })
}

/** B6: after a repair or replacement, is it fixed? A "No" at the limit goes to Vekro support. */
export async function reconfirm(orderId: string, accepted: boolean, notes: string | null): Promise<void> {
  await api.post('/transactions/{transaction_id}/buyer-reconfirmation', {
    path: { transaction_id: orderId },
    body: { accepted, notes },
  })
}

/** Closure on a resolved case; the case closes when both sides confirm. */
export async function confirmResolved(orderId: string, side: 'buyer' | 'seller'): Promise<void> {
  if (side === 'buyer')
    await api.post('/transactions/{transaction_id}/confirm-resolved-buyer', {
      path: { transaction_id: orderId },
    })
  else
    await api.post('/transactions/{transaction_id}/confirm-resolved-seller', {
      path: { transaction_id: orderId },
    })
}

export interface TimelineEvent {
  kind: string
  at: string
  title: string
  description: string
}

/** The order's history, oldest first, in words for the caller's role (never includes the code). */
export async function getTimeline(orderId: string, signal?: AbortSignal): Promise<TimelineEvent[]> {
  return api.get('/transactions/{transaction_id}/timeline', { path: { transaction_id: orderId }, signal })
}
