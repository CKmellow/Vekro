import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { StatusView } from '@/lib/status'
import { formatEat, formatEatFull, formatRelative } from '@/lib/time'
import { getAvailableActions } from '@/models/domain/actions'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import type { OrderSegment, OrderSort, OrderSummary } from '@/models/domain/order'
import { statusView } from '@/models/domain/stateMeta'
import { useOrders } from '@/models/queries/orders'
import { useOnline } from './useOnline'
import { useOrderTransition } from './useOrderTransition'

export const PAGE_SIZE = 20

const SEGMENTS: { value: OrderSegment; label: string; empty: string; hint: string }[] = [
  {
    value: 'needs_action',
    label: 'Needs action',
    empty: 'Nothing needs your action',
    hint: 'New paid orders show here first.',
  },
  { value: 'in_transit', label: 'In transit', empty: 'No orders on the way.', hint: '' },
  { value: 'held', label: 'Held', empty: 'No payments are on hold.', hint: '' },
  { value: 'completed', label: 'Completed', empty: 'Completed orders will show here.', hint: '' },
  { value: 'issues', label: 'Issues', empty: 'No open issues. Nice.', hint: '' },
]

const DEADLINE_LABEL: Record<Deadline['kind'], string> = {
  dispatch: 'left to dispatch',
  inspect: 'left for the buyer to inspect',
  hold: 'until the payment is released',
  return_send: 'for the buyer to send it back',
  return_confirm: 'left to confirm the return',
}

export type QuickAction = { kind: 'dispatch' | 'mark_arrived'; label: string } | null

export interface OrderRow {
  id: string
  reference: string
  title: string
  photoUrl: string | null
  buyerName: string
  buyerPhone: string | null
  amount: number
  status: StatusView
  deadline: (Deadline & { label: string }) | null
  placed: string
  placedFull: string
  quickAction: QuickAction
}

/** The seller's quick action for a row: the same rule as S6, from getAvailableActions. */
export function quickAction(order: Pick<OrderSummary, 'status'>): QuickAction {
  const [action] = getAvailableActions('seller', order)
  if (action === 'dispatch') return { kind: 'dispatch', label: 'Dispatch' }
  if (action === 'mark_arrived') return { kind: 'mark_arrived', label: 'Mark arrived' }
  return null
}

export function toOrderRow(order: OrderSummary, now = new Date()): OrderRow {
  const deadline = currentDeadline(order)
  return {
    id: order.id,
    reference: order.reference,
    title: order.listing.title,
    photoUrl: order.listing.photoUrl,
    buyerName: order.counterpart.name,
    buyerPhone: order.counterpart.phoneMasked,
    amount: order.amount,
    status: statusView(order.status, 'seller'),
    deadline: deadline ? { ...deadline, label: DEADLINE_LABEL[deadline.kind] } : null,
    placed: formatRelative(order.createdAt, now),
    placedFull: formatEatFull(order.createdAt),
    quickAction: quickAction(order),
  }
}

const isSegment = (value: string | null): value is OrderSegment => SEGMENTS.some((s) => s.value === value)

/** Table header sort to the API sort. */
const SORTS: Record<string, OrderSort> = {
  'placed:desc': 'newest',
  'placed:asc': 'oldest',
  'amount:desc': 'amount_desc',
  'amount:asc': 'amount_asc',
}

/** S5 Orders list (design/S5-orders). Filters live in the URL so reloads, links and Back keep them. */
export function useOrdersPage() {
  const navigate = useNavigate()
  const online = useOnline()
  const [params, setParams] = useSearchParams()
  const segment = isSegment(params.get('segment')) ? (params.get('segment') as OrderSegment) : 'needs_action'
  const q = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const sortKey = params.get('sort') ?? 'placed:desc'
  const [search, setSearch] = useState(q)

  // Typing updates the field at once and the URL (and the request) after 300ms.
  useEffect(() => setSearch(q), [q])
  useEffect(() => {
    if (search === q) return
    const id = window.setTimeout(() => update({ q: search.trim() || null, page: null }), 300)
    return () => window.clearTimeout(id)
  })

  function update(changes: Record<string, string | null>) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          if (value === null) next.delete(key)
          else next.set(key, value)
        }
        return next
      },
      { replace: true },
    )
  }

  const query = useOrders({
    segment,
    q: q || undefined,
    sort: SORTS[sortKey] ?? 'newest',
    page,
    pageSize: PAGE_SIZE,
  })
  const transition = useOrderTransition()
  const list = query.data
  const counts = list?.segmentCounts
  const allOrders = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined
  const meta = SEGMENTS.find((s) => s.value === segment)
  const [key, direction] = sortKey.split(':') as [string, 'asc' | 'desc']

  return {
    total: allOrders,
    segments: SEGMENTS.map((s) => ({ value: s.value, label: s.label, count: counts?.[s.value] })),
    segment,
    setSegment: (value: OrderSegment) => update({ segment: value, page: null }),
    search,
    setSearch,
    clearSearch: () => {
      setSearch('')
      update({ q: null, page: null })
    },
    q,
    sort: { key, direction },
    setSort: (sort: { key: string; direction: 'asc' | 'desc' }) =>
      update({ sort: `${sort.key}:${sort.direction}`, page: null }),
    page,
    pageCount: list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1,
    setPage: (next: number) => update({ page: next > 1 ? String(next) : null }),
    range: list &&
      list.total > 0 && {
        from: (list.page - 1) * list.pageSize + 1,
        to: (list.page - 1) * list.pageSize + list.items.length,
        of: list.total,
      },
    rows: (list?.items ?? []).map((order) => toOrderRow(order)),
    serverOffsetMs: list?.serverOffsetMs ?? 0,
    emptyText: { title: meta?.empty ?? '', hint: meta?.hint ?? '' },
    state: list
      ? allOrders === 0
        ? ('no_orders' as const)
        : list.items.length === 0
          ? q
            ? ('no_results' as const)
            : ('segment_empty' as const)
          : ('ready' as const)
      : query.isPending
        ? ('loading' as const)
        : ('error' as const),
    retry: () => void query.refetch(),
    online,
    staleSince: !online && list ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    open: (id: string) => navigate(`/seller/orders/${id}`),
    transition,
    askQuick: (row: OrderRow) =>
      row.quickAction &&
      transition.ask({ orderId: row.id, reference: row.reference, transition: row.quickAction.kind }),
  }
}
