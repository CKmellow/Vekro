import type {
  CreatedOrder,
  Order,
  OrderDeadlines,
  OrderList,
  OrderListFilter,
  OrderSummary,
  PaymentInstruction,
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
