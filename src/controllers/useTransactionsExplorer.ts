import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { formatEatFull, formatRelative } from '@/lib/time'
import { SEARCH_PAGE } from '@/models/api/admin'
import type { AdminSearchFilter, AdminTransactionRow } from '@/models/domain/adminCase'
import { currentDeadline } from '@/models/domain/deadlines'
import { STATE_META, statusView, type TransactionStatus } from '@/models/domain/stateMeta'
import { useTransactionSearch } from '@/models/queries/admin'
import { useOrder } from '@/models/queries/orders'
import { useStaleSince } from './useOnline'

/** Status groups for the filter, the same grouping the seller order list uses. */
export const STATUS_GROUPS: { value: string; label: string; statuses: TransactionStatus[] }[] = [
  { value: 'unpaid', label: 'Not paid', statuses: ['initiated', 'awaiting_payment'] },
  {
    value: 'escrow',
    label: 'In escrow',
    statuses: ['locked', 'out_for_delivery', 'dispatched', 'at_door_pending_inspection', 'hold_24h'],
  },
  {
    value: 'dispute',
    label: 'Disputes',
    statuses: [
      'disputed_functional',
      'return_in_transit',
      'return_received',
      'awaiting_buyer_reconfirmation',
      'escalated_admin_review',
    ],
  },
  {
    value: 'closed',
    label: 'Closed',
    statuses: [
      'released',
      'resolved_release',
      'refunded_buyer',
      'resolved_refund',
      'returned_to_seller',
      'resolved_split',
    ],
  },
]

export function toExplorerRow(r: AdminTransactionRow, now = new Date()) {
  return {
    id: r.transactionId,
    reference: r.reference,
    buyer: r.buyer,
    seller: r.seller,
    itemTitle: r.itemTitle,
    amount: r.amount,
    status: statusView(r.status, 'admin'),
    created: formatEatFull(r.createdAt),
    lastEvent: r.lastEvent ? `${r.lastEvent.title} · ${formatRelative(r.lastEvent.at, now)}` : '—',
    disputeId: r.disputeId,
  }
}

/** A4 Transactions explorer (design/A4-transactions). Route /admin/transactions. Read only. */
export function useTransactionsExplorer() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const groups = params.getAll('group')
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [search, setSearch] = useState(q)
  const [selected, setSelected] = useState<string | null>(null)
  useEffect(() => setSearch(q), [q])

  const numberParam = (key: string) => (params.get(key) ? Number(params.get(key)) : undefined)
  const filter: AdminSearchFilter = {
    q: q || undefined,
    statuses: STATUS_GROUPS.filter((g) => groups.includes(g.value)).flatMap((g) => g.statuses),
    placedFrom: params.get('from') ?? undefined,
    placedTo: params.get('to') ?? undefined,
    minAmount: numberParam('min'),
    maxAmount: numberParam('max'),
    serialized:
      params.get('type') === 'serialized' ? true : params.get('type') === 'standard' ? false : undefined,
    page,
  }
  const query = useTransactionSearch(filter)
  const staleSince = useStaleSince(query)
  const detail = useOrder(selected ?? '', { enabled: Boolean(selected) })

  function update(changes: Record<string, string | string[] | null>) {
    setParams(
      (current) => {
        const next = new URLSearchParams(current)
        for (const [key, value] of Object.entries(changes)) {
          next.delete(key)
          if (Array.isArray(value)) value.forEach((v) => next.append(key, v))
          else if (value) next.set(key, value)
        }
        if (!('page' in changes)) next.delete('page')
        return next
      },
      { replace: true },
    )
  }

  const data = query.data
  const filtered = Boolean(
    q ||
    groups.length ||
    params.get('from') ||
    params.get('to') ||
    params.get('min') ||
    params.get('max') ||
    params.get('type'),
  )
  const order = detail.data
  const row = (data?.items ?? []).find((r) => r.transactionId === selected)

  return {
    staleSince,
    search,
    setSearch,
    submitSearch: () => update({ q: search.trim() || null }),
    groups: STATUS_GROUPS.map((g) => ({ value: g.value, label: g.label, active: groups.includes(g.value) })),
    toggleGroup: (value: string) =>
      update({ group: groups.includes(value) ? groups.filter((g) => g !== value) : [...groups, value] }),
    from: params.get('from') ?? '',
    to: params.get('to') ?? '',
    min: params.get('min') ?? '',
    max: params.get('max') ?? '',
    type: params.get('type') ?? '',
    setField: (key: 'from' | 'to' | 'min' | 'max' | 'type', value: string) =>
      update({ [key]: value || null }),
    clear: () => {
      setSearch('')
      setParams({}, { replace: true })
    },
    filtered,
    heading: filtered ? 'Results' : 'Recent activity',
    rows: (data?.items ?? []).map((r) => toExplorerRow(r)),
    range:
      data && data.total > 0
        ? {
            from: (data.page - 1) * SEARCH_PAGE + 1,
            to: (data.page - 1) * SEARCH_PAGE + data.items.length,
            of: data.total,
          }
        : null,
    page,
    pageCount: data ? Math.max(1, Math.ceil(data.total / SEARCH_PAGE)) : 1,
    setPage: (next: number) => update({ page: next > 1 ? String(next) : null }),
    state: data
      ? data.items.length === 0
        ? ('empty' as const)
        : ('ready' as const)
      : query.isPending
        ? ('loading' as const)
        : ('error' as const),
    q,
    retry: () => void query.refetch(),
    selected,
    open: setSelected,
    close: () => setSelected(null),
    detail: order
      ? {
          id: order.id,
          reference: order.reference,
          amount: order.amount,
          status: statusView(order.status, 'admin'),
          ring: STATE_META[order.status].ring,
          itemTitle: order.listing.title,
          isSerialized: order.listing.isSerialized,
          // Full phones come from the admin search row; the order read masks them for everyone.
          buyer: row?.buyer ?? { name: order.buyer.name, phone: order.buyer.phoneMasked ?? '' },
          seller: row?.seller ?? { name: order.seller.name, phone: order.seller.phoneMasked ?? '' },
          deadline: currentDeadline(order),
          serverOffsetMs: order.serverOffsetMs,
          disputeId: row?.disputeId ?? null,
        }
      : null,
    detailState: !selected
      ? ('closed' as const)
      : order
        ? ('ready' as const)
        : detail.isError
          ? ('error' as const)
          : ('loading' as const),
  }
}
