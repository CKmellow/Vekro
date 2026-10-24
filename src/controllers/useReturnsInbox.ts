import { useNavigate, useSearchParams } from 'react-router'
import type { StatusView } from '@/lib/status'
import { formatEat } from '@/lib/time'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import { issueLabel } from '@/models/domain/listing'
import type { OrderSummary } from '@/models/domain/order'
import { statusView, type TransactionStatus } from '@/models/domain/stateMeta'
import { useOrders } from '@/models/queries/orders'
import { useOnline } from './useOnline'

export type ReturnsTab = 'awaiting_return' | 'action_needed' | 'awaiting_buyer' | 'closed'

export const RETURN_TABS: {
  value: ReturnsTab
  label: string
  statuses: TransactionStatus[]
  empty: [string, string]
}[] = [
  {
    value: 'awaiting_return',
    label: 'Awaiting return',
    statuses: ['disputed_functional', 'return_in_transit'],
    empty: ['No items on their way back.', "If a buyer reports a problem, you'll see the return here."],
  },
  {
    value: 'action_needed',
    label: 'Action needed',
    statuses: ['return_received'],
    empty: ['Nothing waiting on you.', 'When a returned item reaches you, confirm it here and choose a fix.'],
  },
  {
    value: 'awaiting_buyer',
    label: 'Awaiting buyer',
    statuses: ['awaiting_buyer_reconfirmation', 'escalated_admin_review'],
    empty: ['No one to wait for.', 'After you repair or replace an item, the buyer confirms here.'],
  },
  {
    value: 'closed',
    label: 'Closed',
    // refunded_buyer also covers refunds at the door; only rows with a dispute belong here.
    statuses: ['refunded_buyer', 'resolved_refund', 'resolved_release', 'resolved_split'],
    empty: ['No closed returns yet.', ''],
  },
]

export interface ReturnCard {
  id: string
  reference: string
  title: string
  photoUrl: string | null
  amount: number
  category: string | null
  status: StatusView
  escalated: boolean
  deadline: (Deadline & { line: string }) | null
}

const LINE: Partial<Record<Deadline['kind'], string>> = {
  return_send: 'The buyer is sending it back',
  return_confirm: 'Confirm receipt, or it goes to Vekro support',
}

export function toReturnCard(order: OrderSummary): ReturnCard {
  const deadline = currentDeadline(order)
  return {
    id: order.id,
    reference: order.reference,
    title: order.listing.title,
    photoUrl: order.listing.photoUrl,
    amount: order.amount,
    category: issueLabel(order.disputeCategory),
    status: statusView(order.status, 'seller'),
    escalated: order.status === 'escalated_admin_review',
    deadline: deadline && LINE[deadline.kind] ? { ...deadline, line: LINE[deadline.kind] ?? '' } : null,
  }
}

const isTab = (value: string | null): value is ReturnsTab => RETURN_TABS.some((t) => t.value === value)

/** S10 Returns inbox (design/S10-returns). Route /seller/returns. */
export function useReturnsInbox() {
  const navigate = useNavigate()
  const online = useOnline()
  const [params, setParams] = useSearchParams()
  const tab = isTab(params.get('tab')) ? (params.get('tab') as ReturnsTab) : 'awaiting_return'
  const meta = RETURN_TABS.find((t) => t.value === tab) ?? RETURN_TABS[0]
  const query = useOrders({ statuses: meta?.statuses, pageSize: 50 })
  const list = query.data
  const counts = list?.statusCounts
  const count = (statuses: TransactionStatus[]) =>
    counts ? statuses.reduce((sum, s) => sum + (counts[s] ?? 0), 0) : undefined
  const items = (list?.items ?? []).filter((o) => tab !== 'closed' || o.disputeCategory !== null)
  const resolved =
    (counts?.resolved_refund ?? 0) + (counts?.resolved_release ?? 0) + (counts?.resolved_split ?? 0)
  const anyReturns = RETURN_TABS.slice(0, 3).some((t) => (count(t.statuses) ?? 0) > 0) || resolved > 0

  return {
    tab,
    setTab: (value: string) => setParams({ tab: value }, { replace: true }),
    tabs: RETURN_TABS.map((t) => ({
      value: t.value,
      label: t.label,
      count: t.value === 'closed' ? undefined : count(t.statuses),
    })),
    empty: meta?.empty ?? ['', ''],
    cards: items.map(toReturnCard),
    serverOffsetMs: list?.serverOffsetMs ?? 0,
    state: list
      ? items.length > 0
        ? ('ready' as const)
        : anyReturns
          ? ('tab_empty' as const)
          : ('no_returns' as const)
      : query.isPending
        ? ('loading' as const)
        : ('error' as const),
    retry: () => void query.refetch(),
    online,
    staleSince: !online && list ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    primary: tab === 'action_needed',
    open: (id: string) => navigate(`/seller/returns/${id}`),
  }
}
