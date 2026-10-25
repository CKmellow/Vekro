import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmResolved,
  createOrder,
  dispatchOrder,
  escalate,
  getOrder,
  getPublicOrder,
  getSellerSummary,
  getTimeline,
  giveDeliveryCode,
  listOrders,
  markArrived,
  markSentBack,
  reconfirm,
  reportIssue,
  sellerReceived,
  sellerResolution,
  rejectAtDoor,
  resendPayment,
} from '@/models/api/transactions'
import type { DisputeCategory, Order, OrderListFilter } from '@/models/domain/order'

export const orderKeys = {
  all: ['orders'] as const,
  list: (filter: OrderListFilter) => ['orders', 'list', filter] as const,
  summary: ['orders', 'summary'] as const,
  detail: (id: string) => ['orders', 'detail', id] as const,
  timeline: (id: string) => ['orders', 'timeline', id] as const,
}

/** GET /transactions/{id}/timeline; refreshed whenever the order itself changes (see useDoorDecision). */
export const useOrderTimeline = (id: string, options: { enabled?: boolean; updatedAt?: string } = {}) =>
  useQuery({
    queryKey: [...orderKeys.timeline(id), options.updatedAt ?? ''],
    queryFn: ({ signal }) => getTimeline(id, signal),
    enabled: options.enabled ?? true,
    placeholderData: (previous) => previous,
  })

/** The caller's order list (GET /transactions). Keeps the previous page on screen while the next loads. */
/**
 * B9 "Track an order": the signed-in buyer's own order with this exact reference, or null. Searches only
 * the caller's orders, so a reference never opens someone else's order.
 */
export const useFindOwnOrder = () =>
  useMutation({
    mutationFn: async (reference: string) => {
      const list = await listOrders({ q: reference, pageSize: 5 })
      return list.items.find((o) => o.reference.toUpperCase() === reference.toUpperCase())?.id ?? null
    },
  })

/** B3 phone gate: the public summary of an order link (no personal data). */
export const usePublicOrder = (key: string, enabled: boolean) =>
  useQuery({
    queryKey: ['orders', 'public', key] as const,
    queryFn: ({ signal }) => getPublicOrder(key, signal),
    enabled,
    staleTime: 60_000,
  })

export const useOrders = (
  filter: OrderListFilter = {},
  options: { enabled?: boolean; refetchInterval?: number | false } = {},
) =>
  useQuery({
    queryKey: orderKeys.list(filter),
    queryFn: ({ signal }) => listOrders(filter, signal),
    enabled: options.enabled ?? true,
    refetchInterval: options.refetchInterval ?? false,
    refetchIntervalInBackground: false,
    placeholderData: (previous) => previous,
  })

/** The seller dashboard totals; refetches with every order change (it shares the orders key). */
export const useSellerSummary = () =>
  useQuery({ queryKey: orderKeys.summary, queryFn: ({ signal }) => getSellerSummary(signal) })

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

/** Refetch the order after a door decision so every screen sees the new state. */
function useDoorDecision<V>(orderId: string, run: (variables: V) => Promise<void>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSettled: () => client.invalidateQueries({ queryKey: orderKeys.detail(orderId) }),
  })
}

export const useGiveCode = (orderId: string) =>
  useDoorDecision(orderId, (code: string) => giveDeliveryCode(orderId, code))
export const useRejectAtDoor = (orderId: string) =>
  useDoorDecision(orderId, ({ reason, note }: { reason: string | null; note: string | null }) =>
    rejectAtDoor(orderId, reason, note),
  )

export type SellerTransition = 'dispatch' | 'mark_arrived'

/** Dispatch or arrival for any of the seller's orders; every order query refetches when it settles. */
export function useSellerTransition() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, transition }: { orderId: string; transition: SellerTransition }) =>
      transition === 'dispatch' ? dispatchOrder(orderId) : markArrived(orderId),
    onSettled: () => client.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

/** Buyer and seller dispute steps; every order query refetches when one settles (409 means it moved on). */
function useDisputeStep<V>(run: (variables: V) => Promise<void>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSettled: () => client.invalidateQueries({ queryKey: orderKeys.all }),
  })
}

export const useReportIssue = (orderId: string) =>
  useDisputeStep(({ category, description }: { category: DisputeCategory; description: string }) =>
    reportIssue(orderId, category, description),
  )
export const useMarkSentBack = (orderId: string) => useDisputeStep(() => markSentBack(orderId))
export const useReconfirm = (orderId: string) =>
  useDisputeStep(({ accepted, notes }: { accepted: boolean; notes: string | null }) =>
    reconfirm(orderId, accepted, notes),
  )
export const useConfirmResolved = (orderId: string, side: 'buyer' | 'seller') =>
  useDisputeStep(() => confirmResolved(orderId, side))
export const useSellerReceived = (orderId: string) => useDisputeStep(() => sellerReceived(orderId))
export const useSellerResolution = (orderId: string) =>
  useDisputeStep(
    ({
      action,
      notes,
    }: {
      action: 'refund_issued' | 'repair_shipped' | 'replacement_shipped'
      notes: string | null
    }) => sellerResolution(orderId, action, notes),
  )
export const useEscalate = (orderId: string) => useDisputeStep((reason: string) => escalate(orderId, reason))
