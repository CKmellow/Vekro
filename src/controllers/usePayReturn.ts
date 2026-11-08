import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '@/models/api/errors'
import { useOrder, useRefreshCardPayment } from '@/models/queries/orders'
import { useOnline } from './useOnline'

const POLL_MS = 3000
const WINDOW_MS = 90_000
const UNPAID = new Set(['initiated', 'awaiting_payment'])

export type PayReturnState = 'confirming' | 'not_confirmed' | 'unmatched' | 'not_found' | 'failed'

/**
 * /pay/return after Pesapal's card checkout (FRONTEND_CONTRACT B). The backend sends the buyer back
 * with `order` (our order id). Arriving here confirms nothing and no query parameter is trusted
 * for the result: the page asks the backend to check the payment once, then polls the order every
 * 3s for 90s. When it is paid, B2 shows the same success as an M-Pesa payment.
 */
export function usePayReturn() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const online = useOnline()
  const orderId = params.get('order') ?? ''
  const refresh = useRefreshCardPayment(orderId)
  const [windowStart, setWindowStart] = useState(() => Date.now())
  const [expired, setExpired] = useState(false)
  const checked = useRef(false)

  const query = useOrder(orderId, {
    enabled: Boolean(orderId),
    refetchInterval: (order) => ((order && !UNPAID.has(order.status)) || expired ? false : POLL_MS),
  })
  const order = query.data

  // One server-side check on arrival, in case Pesapal's notification is still on its way.
  useEffect(() => {
    if (!orderId || checked.current) return
    checked.current = true
    refresh.mutate()
  }, [orderId, refresh])

  useEffect(() => {
    const timer = window.setTimeout(
      () => setExpired(true),
      Math.max(0, WINDOW_MS - (Date.now() - windowStart)),
    )
    return () => window.clearTimeout(timer)
  }, [windowStart])

  useEffect(() => {
    if (order && !UNPAID.has(order.status)) navigate(`/order/${order.id}/payment`, { replace: true })
  }, [order, navigate])

  const failed =
    order?.payment && (order.payment.status === 'failed' || order.payment.status === 'failed_to_initiate')

  const state: PayReturnState = !orderId
    ? 'unmatched'
    : query.error instanceof ApiError && query.error.kind === 'not_found'
      ? 'not_found'
      : failed
        ? 'failed'
        : expired
          ? 'not_confirmed'
          : 'confirming'

  return {
    state,
    online,
    reference: order?.reference ?? null,
    retrying: refresh.isPending,
    /** Check with Pesapal again and poll for another 90s. */
    retry: () => {
      refresh.mutate()
      setExpired(false)
      setWindowStart(Date.now())
      void query.refetch()
    },
    trackOrder: () => navigate(`/order/${orderId}`),
    backToPayment: () => navigate(`/order/${orderId}/payment`),
  }
}
