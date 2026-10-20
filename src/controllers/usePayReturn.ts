import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { ApiError } from '@/models/api/errors'
import { useOrder } from '@/models/queries/orders'
import { useOnline } from './useOnline'

const POLL_MS = 3000
const WINDOW_MS = 90_000
const UNPAID = new Set(['initiated', 'awaiting_payment'])

export type PayReturnState = 'confirming' | 'slow' | 'unmatched' | 'not_found' | 'failed'

/**
 * /pay/return after hosted checkout (FRONTEND_CONTRACT B). The provider sends back `OrderTrackingId` and
 * `OrderMerchantReference` (our transaction id). Arriving here confirms nothing: only polling the
 * transaction to `locked` does, and then B2 shows the success.
 */
export function usePayReturn() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const online = useOnline()
  const orderId = params.get('OrderMerchantReference') ?? ''
  const hasTracking = Boolean(params.get('OrderTrackingId'))
  const [started] = useState(() => Date.now())
  const [slow, setSlow] = useState(false)

  const query = useOrder(orderId, {
    enabled: Boolean(orderId),
    refetchInterval: (order) => ((order && !UNPAID.has(order.status)) || slow ? false : POLL_MS),
  })
  const order = query.data

  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), Math.max(0, WINDOW_MS - (Date.now() - started)))
    return () => window.clearTimeout(timer)
  }, [started])

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
        : slow
          ? 'slow'
          : 'confirming'

  return {
    state,
    hasTracking,
    online,
    reference: order?.reference ?? null,
    trackOrder: () => navigate(`/order/${orderId}`),
    backToPayment: () => navigate(`/order/${orderId}/payment`),
  }
}
