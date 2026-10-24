import { useNavigate } from 'react-router'
import { formatEat } from '@/lib/time'
import { getAvailableActions } from '@/models/domain/actions'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import type { OrderSegment, OrderSummary } from '@/models/domain/order'
import { useListings } from '@/models/queries/listings'
import { useOrders, useSellerSummary } from '@/models/queries/orders'
import { useOnline } from './useOnline'
import { useOrderTransition } from './useOrderTransition'
import { toOrderRow } from './useOrdersPage'
import { useSession } from './useSession'

const ACTION_CARDS = 3

export interface DashboardAction {
  id: string
  reference: string
  title: string
  photoUrl: string | null
  instruction: string
  deadline: (Deadline & { label: string }) | null
  button: { label: string; kind: 'dispatch' | 'mark_arrived' | 'open_case' }
}

export interface KpiTile {
  key: string
  title: string
  value: { money: number } | { count: number }
  caption: string
  delta?: { text: string; up: boolean }
  alert?: boolean
  to: string
}

const ordersAt = (segment: OrderSegment) => `/seller/orders?segment=${segment}`

/** What the seller must do for an order, from getAvailableActions (design/S4-dashboard, Needs your action). */
export function dashboardAction(order: OrderSummary): DashboardAction | null {
  const [action] = getAvailableActions('seller', order)
  const deadline = currentDeadline(order)
  const base = {
    id: order.id,
    reference: order.reference,
    title: order.listing.title,
    photoUrl: order.listing.photoUrl,
  }
  switch (action) {
    case 'dispatch':
      return {
        ...base,
        instruction: `Dispatch ${order.reference} before the timer runs out`,
        deadline: deadline && { ...deadline, label: 'Time left to dispatch' },
        button: { label: 'Mark as dispatched', kind: 'dispatch' },
      }
    case 'mark_arrived':
      return {
        ...base,
        instruction: `Tell the buyer ${order.reference} has arrived`,
        deadline: null,
        button: { label: 'Mark as arrived', kind: 'mark_arrived' },
      }
    case 'confirm_return_received':
      return {
        ...base,
        instruction: `Confirm you received ${order.reference}`,
        deadline: deadline && { ...deadline, label: 'Time left to confirm the return' },
        button: { label: 'Confirm received', kind: 'open_case' },
      }
    case 'choose_resolution':
      return {
        ...base,
        instruction: `Choose a resolution for ${order.reference}`,
        deadline: null,
        button: { label: 'Open case', kind: 'open_case' },
      }
    default:
      return null
  }
}

/** "+12%" against last month, or nothing when last month had no sales. */
export function monthDelta(thisMonth: number, lastMonth: number): KpiTile['delta'] {
  if (lastMonth <= 0) return undefined
  const change = Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
  return { text: `${change >= 0 ? '+' : ''}${change}%`, up: change >= 0 }
}

/** "Good morning" before noon, "Good afternoon" before 17:00, then "Good evening", in EAT. */
export function greeting(now = new Date()): string {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', { timeZone: 'Africa/Nairobi', hour: '2-digit', hour12: false }).format(
      now,
    ),
  )
  return hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
}

const today = (now = new Date()) =>
  new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Nairobi',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)

/** S4 Dashboard (design/S4-dashboard). Route /seller. */
export function useSellerDashboard() {
  const navigate = useNavigate()
  const online = useOnline()
  const session = useSession()
  const summary = useSellerSummary()
  const needing = useOrders({ segment: 'needs_action', sort: 'oldest', pageSize: 10 })
  const recent = useOrders({ pageSize: 5 })
  const listings = useListings()
  const transition = useOrderTransition()

  const user = session.status === 'authenticated' ? session.user : null
  const counts = recent.data?.segmentCounts
  const totalOrders = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined
  const listingCount = listings.data
    ? Object.values(listings.data.counts).reduce((a, b) => a + b, 0)
    : undefined
  const s = summary.data
  const actions = (needing.data?.items ?? []).map(dashboardAction).filter((a) => a !== null)

  const failed = summary.isError || needing.isError || recent.isError
  const ready = Boolean(s && needing.data && recent.data)

  return {
    state: ready
      ? totalOrders === 0
        ? ('new_seller' as const)
        : ('ready' as const)
      : failed
        ? ('error' as const)
        : ('loading' as const),
    retry: () => {
      void summary.refetch()
      void needing.refetch()
      void recent.refetch()
    },
    online,
    staleSince: !online && recent.data ? formatEat(new Date(recent.dataUpdatedAt).toISOString()) : null,
    greeting: `${greeting()}, ${(user?.name ?? '').split(' ')[0]}`,
    today: today(),
    kpis: s
      ? ([
          {
            key: 'escrow',
            title: 'In escrow',
            value: { money: s.inEscrow.amount },
            caption: `Held for ${s.inEscrow.orders} order${s.inEscrow.orders === 1 ? '' : 's'}`,
            to: ordersAt('in_transit'),
          },
          {
            key: 'dispatch',
            title: 'Awaiting dispatch',
            value: { count: s.awaitingDispatch },
            caption: 'Dispatch within 48 hours of payment',
            to: ordersAt('needs_action'),
          },
          {
            key: 'released',
            title: 'Released this month',
            value: { money: s.releasedThisMonth.amount },
            caption: `${s.releasedThisMonth.orders} order${s.releasedThisMonth.orders === 1 ? '' : 's'} paid out`,
            delta: monthDelta(s.releasedThisMonth.amount, s.releasedLastMonth.amount),
            to: ordersAt('completed'),
          },
          {
            key: 'issues',
            title: 'Open issues',
            value: { count: s.openIssues },
            caption: 'Returns waiting on you',
            alert: s.openIssues > 0,
            to: ordersAt('issues'),
          },
        ] satisfies KpiTile[])
      : [],
    actions: actions.slice(0, ACTION_CARDS),
    moreActions: Math.max(0, actions.length - ACTION_CARDS),
    serverOffsetMs: needing.data?.serverOffsetMs ?? 0,
    recent: (recent.data?.items ?? []).map((order) => toOrderRow(order)),
    payouts: s
      ? {
          paidThisMonth: s.releasedThisMonth.amount,
          next: s.nextRelease,
        }
      : null,
    showTip: listingCount !== undefined && listingCount < 3,
    checklist: [
      { label: 'Add your M-Pesa payout number', done: Boolean(user?.mpesa_phone), to: '/onboarding' },
      { label: 'Create your first listing', done: (listingCount ?? 0) > 0, to: '/seller/listings/new' },
      { label: 'Share your Trust Link', done: (totalOrders ?? 0) > 0, to: '/seller/listings' },
    ],
    transition,
    runAction: (action: DashboardAction) => {
      if (action.button.kind === 'open_case') navigate(`/seller/returns/${action.id}`)
      else transition.ask({ orderId: action.id, reference: action.reference, transition: action.button.kind })
    },
  }
}
