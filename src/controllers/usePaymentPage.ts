import { useState } from 'react'
import { useNavigate } from 'react-router'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import type { Order, PaymentFailure } from '@/models/domain/order'
import { statusView } from '@/models/domain/stateMeta'
import { useOrder, usePayByCard, useResendPayment } from '@/models/queries/orders'
import { useNow } from './useNow'
import { useOnline } from './useOnline'
import { moneyHolder, payingHint, paymentNote } from '@/models/domain/paymentNote'

const POLL_MS = 3000
/** Keep polling a little past expiry: a PIN entered at the last second still confirms. */
const GRACE_MS = 10_000
const UNPAID = new Set(['initiated', 'awaiting_payment'])

export type PaymentVariant =
  | { kind: 'waiting'; expiresAt: string | null; sentAt: string | null }
  | { kind: 'redirect'; url: string }
  | { kind: 'timed_out' }
  | { kind: 'failed'; reason: PaymentFailure; card: boolean }
  | { kind: 'not_started' }
  | { kind: 'success' }

/** What B2 shows. Success comes only from the transaction status, never from the prompt (contract B). */
export function paymentVariant(order: Order, serverNow: number): PaymentVariant {
  if (!UNPAID.has(order.status)) return { kind: 'success' }
  const payment = order.payment
  if (!payment) return { kind: 'waiting', expiresAt: null, sentAt: null }
  switch (payment.status) {
    case 'failed':
      return {
        kind: 'failed',
        reason: payment.failureReason ?? 'provider_error',
        card: payment.kind === 'REDIRECT' || order.collection.rail === 'pesapal',
      }
    case 'failed_to_initiate':
      return { kind: 'not_started' }
    case 'expired':
      return { kind: 'timed_out' }
    default:
      if (payment.kind === 'REDIRECT' && payment.redirectUrl)
        return { kind: 'redirect', url: payment.redirectUrl }
      if (serverNow >= new Date(payment.expiresAt).getTime()) return { kind: 'timed_out' }
      return { kind: 'waiting', expiresAt: payment.expiresAt, sentAt: payment.sentAt }
  }
}

/** No prompt is open on the phone: M-Pesa failed, expired or never started (backend #280 guard). */
const PROMPT_CLOSED = new Set<PaymentVariant['kind']>(['failed', 'timed_out', 'not_started'])

/** "Pay by card instead" is offered on an unpaid M-Pesa order once its prompt is closed. */
export function canPayByCard(order: Order, variant: PaymentVariant): boolean {
  const rail = order.collection.rail
  return rail !== 'pesapal' && rail !== 'econfirm' && PROMPT_CLOSED.has(variant.kind)
}

/** Poll every 3s while a prompt can still be answered (90s window plus grace), else stop. */
export function pollInterval(order: Order | undefined, deviceNow = Date.now()): number | false {
  if (!order) return POLL_MS
  if (!UNPAID.has(order.status)) return false
  const payment = order.payment
  if (!payment) return POLL_MS
  if (payment.status !== 'pending' && payment.status !== 'succeeded') return false
  const open = deviceNow + order.serverOffsetMs < new Date(payment.expiresAt).getTime() + GRACE_MS
  return open ? POLL_MS : false
}

/** B2 Payment (design/B2-payment): polling, variants, resend and leave. */
export function usePaymentPage(orderId: string) {
  const navigate = useNavigate()
  const online = useOnline()
  const query = useOrder(orderId, { refetchInterval: (order) => pollInterval(order) })
  const resend = useResendPayment(orderId)
  const payCard = usePayByCard(orderId)
  const [cooldownUntil, setCooldownUntil] = useState<number | null>(null)
  const [leaveOpen, setLeaveOpen] = useState(false)
  const order = query.data
  const now = useNow(Boolean(order && UNPAID.has(order.status)))
  const serverNow = now + (order?.serverOffsetMs ?? 0)
  const variant = order ? paymentVariant(order, serverNow) : null

  const resendAt = Math.max(
    order?.payment ? new Date(order.payment.resendAvailableAt).getTime() : 0,
    cooldownUntil ?? 0,
  )
  // A card checkout has no resend cooldown (only M-Pesa refuses a second prompt within a minute).
  const card = order?.collection.rail === 'pesapal'
  const resendInSeconds = card ? 0 : Math.max(0, Math.ceil((resendAt - serverNow) / 1000))

  const sendAgain = async () => {
    try {
      await resend.mutateAsync()
      setCooldownUntil(null)
      void query.refetch()
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'rate_limited') {
        setCooldownUntil(serverNow + (error.retryAfterSeconds ?? 30) * 1000)
      } else if (error instanceof ApiError && (error.kind === 'validation' || error.kind === 'conflict')) {
        void query.refetch()
      } else {
        toast.show(
          error instanceof ApiError && error.kind === 'network'
            ? "You're offline. Try again when you're connected."
            : "We couldn't send a new request. Try again.",
          'danger',
        )
      }
    }
  }

  const payByCardInstead = async () => {
    try {
      await payCard.mutateAsync()
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'conflict') {
        void query.refetch()
        toast.show(
          error.retryAfterSeconds
            ? 'Your M-Pesa request is still open. Finish or cancel it on your phone, then try again.'
            : 'This order has changed. We refreshed it.',
          'info',
        )
      } else {
        toast.show(
          error instanceof ApiError && error.kind === 'network'
            ? "You're offline. Try again when you're connected."
            : error instanceof ApiError && error.status === 503
              ? 'Card payments are not available right now.'
              : "We couldn't start the card payment. Try again.",
          'danger',
        )
      }
    }
  }

  return {
    state: order
      ? ('ready' as const)
      : query.isPending
        ? ('loading' as const)
        : query.error instanceof ApiError && query.error.kind === 'not_found'
          ? ('not_found' as const)
          : ('error' as const),
    retry: () => void query.refetch(),
    online,
    order: order
      ? {
          reference: order.reference,
          amount: order.amount,
          title: order.listing.title,
          sellerName: order.seller.name,
          phoneMasked: order.buyer.phoneMasked,
          paymentNote: paymentNote(order),
          card,
          holder: moneyHolder(order.collection.rail),
          payingHint: payingHint(order.collection.rail),
          status: statusView(order.status, 'buyer'),
          serverOffsetMs: order.serverOffsetMs,
        }
      : null,
    variant,
    resendInSeconds,
    resending: resend.isPending,
    sendAgain: () => void sendAgain(),
    canPayByCard: Boolean(order && variant && canPayByCard(order, variant)),
    payByCard: () => void payByCardInstead(),
    switchingToCard: payCard.isPending,
    copyReference: async () => {
      if (!order) return
      try {
        await navigator.clipboard.writeText(order.reference)
        toast.show('Reference copied', 'success')
      } catch {
        toast.show(`Your reference is ${order.reference}`, 'info')
      }
    },
    changeNumber: () => order && navigate(`/pay/${order.listing.id}`),
    trackOrder: () => navigate(`/order/${orderId}`),
    leaveOpen,
    setLeaveOpen,
    leave: () => (order ? navigate(`/pay/${order.listing.id}`) : navigate('/')),
  }
}
