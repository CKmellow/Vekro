import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createOrder, getOrder, resendPayment } from '@/models/api/transactions'
import type { Order } from '@/models/domain/order'

export const orderKeys = {
  all: ['orders'] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
}

interface OrderOptions {
  enabled?: boolean
  /** Poll interval in ms, or a function of the latest order (return false to stop). */
  refetchInterval?: number | false | ((order: Order | undefined) => number | false)
}

/** One order (GET /transactions/{id}). Controllers decide when to poll. */
export function useOrder(id: string, options: OrderOptions = {}) {
  const { refetchInterval } = options
  return useQuery({
    queryKey: orderKeys.detail(id),
    queryFn: ({ signal }) => getOrder(id, signal),
    enabled: options.enabled ?? true,
    refetchInterval:
      typeof refetchInterval === 'function' ? (query) => refetchInterval(query.state.data) : refetchInterval,
    // Polling pauses in background tabs; a returning buyer gets fresh state at once.
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  })
}

/** POST /transactions for a listing. */
export function useCreateOrder() {
  return useMutation({ mutationFn: (listingId: string) => createOrder(listingId) })
}

/** Resend the STK prompt; the cached order picks up the new prompt at once. */
export function useResendPayment(orderId: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => resendPayment(orderId),
    onSuccess: (payment) => {
      client.setQueryData<Order>(orderKeys.detail(orderId), (order) =>
        order ? { ...order, payment } : order,
      )
    },
  })
}
