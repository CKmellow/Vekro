import type { CreatedOrder, Order, PaymentInstruction } from '@/models/domain/order'
import { toPolicy } from './adapters/listings'
import { api, type Schemas } from './client'

type PaymentResponse = Schemas['PaymentInstructionResponse']
type DetailResponse = Schemas['TransactionDetailResponse']

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
    deadlines: {
      dispatchBy: raw.deadlines.dispatch_by ?? null,
      inspectBy: raw.deadlines.inspect_by ?? null,
      holdUntil: raw.deadlines.hold_until ?? null,
      returnSendBy: raw.deadlines.return_send_by ?? null,
      returnConfirmBy: raw.deadlines.return_confirm_by ?? null,
    },
    serverOffsetMs: new Date(raw.server_time).getTime() - receivedAt,
    payment: raw.payment ? toPaymentInstruction(raw.payment) : null,
    doorRejection: raw.door_rejection
      ? { reason: raw.door_rejection.reason ?? null, note: raw.door_rejection.note ?? null }
      : null,
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
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
