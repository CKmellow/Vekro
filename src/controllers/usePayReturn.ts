import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '@/models/api/errors'
import {
  useCardPaymentStatus,
  useCheckCardPayment,
  useOrder,
  useRefreshCardPayment,
} from '@/models/queries/orders'
import { useCurrentUser } from '@/models/queries/session'
import { useOnline } from './useOnline'

const POLL_MS = 3000
const WINDOW_MS = 90_000
const UNPAID = new Set(['initiated', 'awaiting_payment'])

export type PayReturnState =
  | 'confirming'
  | 'not_confirmed'
  | 'unmatched'
  | 'not_found'
  | 'failed'
  /** Paid, and this browser has no session: say so and offer the order link (#300). */
  | 'paid'
  /** Only on an old return URL without Pesapal's tracking id: the signed-in read answered 401. */
  | 'sign_in'

const isApiError = (error: unknown, kind: ApiError['kind']) =>
  error instanceof ApiError && error.kind === kind

/**
 * /pay/return after Pesapal's card checkout (FRONTEND_CONTRACT B). Pesapal sends the buyer back with
 * our `order` and `ref` plus its own `OrderTrackingId`. Arriving here confirms nothing and no query
 * parameter is trusted for the result: the page asks the backend to check the payment once, then
 * polls every 3s for 90s.
 *
 * The status comes from the public, status-only read keyed by the reference and Pesapal's tracking
 * id (backend #308), so it works in a browser without the buyer's session. When the order is paid,
 * a signed-in buyer goes to B2 as before; anyone else sees "Payment received" and the order link.
 * An old URL without the tracking id falls back to the signed-in read.
 */
export function usePayReturn() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const online = useOnline()
  const orderId = params.get('order') ?? ''
  const reference = (params.get('ref') ?? params.get('OrderMerchantReference') ?? '').trim()
  const trackingId = (params.get('OrderTrackingId') ?? '').trim()
  const viaPublic = Boolean(reference && trackingId)

  const session = useCurrentUser()
  const [windowStart, setWindowStart] = useState(() => Date.now())
  const [expired, setExpired] = useState(false)
  const checked = useRef(false)

  const check = useCheckCardPayment(reference, trackingId)
  const status = useCardPaymentStatus(reference, trackingId, {
    enabled: viaPublic,
    refetchInterval: (s) => ((s && s.stateGroup !== 'unpaid') || expired ? false : POLL_MS),
  })
  const refresh = useRefreshCardPayment(orderId)
  const order = useOrder(orderId, {
    enabled: !viaPublic && Boolean(orderId),
    refetchInterval: (o) => ((o && !UNPAID.has(o.status)) || expired ? false : POLL_MS),
  })

  const runCheck = viaPublic ? check.mutate : refresh.mutate

  // One server-side check on arrival, in case Pesapal's notification is still on its way.
  useEffect(() => {
    if (!(viaPublic || orderId) || checked.current) return
    checked.current = true
    runCheck()
  }, [viaPublic, orderId, runCheck])

  useEffect(() => {
    const timer = window.setTimeout(
      () => setExpired(true),
      Math.max(0, WINDOW_MS - (Date.now() - windowStart)),
    )
    return () => window.clearTimeout(timer)
  }, [windowStart])

  const paid = viaPublic
    ? Boolean(status.data && status.data.stateGroup !== 'unpaid')
    : Boolean(order.data && !UNPAID.has(order.data.status))
  const signedIn = Boolean(session.data)
  const handOver = paid && Boolean(orderId) && (!viaPublic || signedIn)

  useEffect(() => {
    if (handOver) navigate(`/order/${orderId}/payment`, { replace: true })
  }, [handOver, orderId, navigate])

  const error = viaPublic ? status.error : order.error
  const payment = order.data?.payment
  const failed = viaPublic
    ? status.data?.paymentStatus === 'failed'
    : payment?.status === 'failed' || payment?.status === 'failed_to_initiate'

  const state: PayReturnState = !(viaPublic || orderId)
    ? 'unmatched'
    : isApiError(error, 'not_found')
      ? 'not_found'
      : paid && !handOver && !session.isPending
        ? 'paid'
        : paid
          ? 'confirming' // handing over to B2
          : !viaPublic && isApiError(error, 'unauthorized')
            ? 'sign_in'
            : failed
              ? 'failed'
              : expired
                ? 'not_confirmed'
                : 'confirming'

  return {
    state,
    online,
    reference: status.data?.reference ?? order.data?.reference ?? (reference || null),
    retrying: viaPublic ? check.isPending : refresh.isPending,
    /** Check with Pesapal again and poll for another 90s. */
    retry: () => {
      runCheck()
      setExpired(false)
      setWindowStart(Date.now())
      void (viaPublic ? status.refetch() : order.refetch())
    },
    /** The order link: without a session it shows the public summary and the sign in. */
    trackOrder: () => navigate(`/order/${orderId || reference}`),
    backToPayment: () => navigate(`/order/${orderId}/payment`),
  }
}
