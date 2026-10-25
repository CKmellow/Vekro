import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import type { StatusView } from '@/lib/status'
import { formatEat, formatEatFull } from '@/lib/time'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import { BUYER_ACTIVE_STATUSES, type OrderListFilter, type OrderSummary } from '@/models/domain/order'
import { statusView } from '@/models/domain/stateMeta'
import { useFindOwnOrder, useOrders } from '@/models/queries/orders'
import { useSignOut } from '@/models/queries/session'
import { useOnline } from './useOnline'
import { progress } from './useOrderTracker'
import { useSession } from './useSession'

export type BuyerSegment = 'all' | 'active' | 'completed' | 'issues'

const SEGMENTS: { value: BuyerSegment; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'issues', label: 'Issues' },
]

const FILTER: Record<BuyerSegment, OrderListFilter> = {
  all: {},
  active: { statuses: BUYER_ACTIVE_STATUSES },
  completed: { segment: 'completed' },
  issues: { segment: 'issues' },
}

const DEADLINE_LABEL: Record<Deadline['kind'], string> = {
  dispatch: 'for the seller to dispatch',
  inspect: 'left to inspect',
  hold: 'until the payment is released',
  return_send: 'left to send it back',
  return_confirm: 'for the seller to confirm the return',
}

export const PAGE_SIZE = 20
const SIGN_IN = `/buyer/sign-in?returnTo=${encodeURIComponent('/buyer/orders')}`

export interface BuyerOrderCard {
  id: string
  reference: string
  title: string
  photoUrl: string | null
  sellerName: string
  amount: number
  status: StatusView
  placed: string
  placedFull: string
  progress: { steps: string[]; current: number } | null
  deadline: (Deadline & { label: string }) | null
}

export function toBuyerCard(order: OrderSummary): BuyerOrderCard {
  const deadline = currentDeadline(order)
  return {
    id: order.id,
    reference: order.reference,
    title: order.listing.title,
    photoUrl: order.listing.photoUrl,
    sellerName: order.counterpart.name,
    amount: order.amount,
    status: statusView(order.status, 'buyer'),
    placed: formatEat(order.createdAt),
    placedFull: formatEatFull(order.createdAt),
    progress: progress(order),
    deadline: deadline ? { ...deadline, label: DEADLINE_LABEL[deadline.kind] } : null,
  }
}

/** An order link (…/order/<id>) or a reference (VK-7K3P9Q) from the "Track an order" field. */
export function parseTrackInput(raw: string): { orderId: string } | { reference: string } | null {
  const text = raw.trim()
  const link = text.match(/\/order\/([0-9a-f-]{36})/i)
  if (link?.[1]) return { orderId: link[1].toLowerCase() }
  const reference = text.match(/^VK-[A-Z0-9]{4,12}$/i)
  if (reference) return { reference: text.toUpperCase() }
  return null
}

const isSegment = (v: string | null): v is BuyerSegment => SEGMENTS.some((s) => s.value === v)

/** B9 My orders (design/B9-my-orders). Route /buyer/orders. The server scopes the list to the buyer. */
export function useMyOrders() {
  const navigate = useNavigate()
  const online = useOnline()
  const session = useSession()
  const signOut = useSignOut()
  const find = useFindOwnOrder()
  const [params, setParams] = useSearchParams()
  const segment = isSegment(params.get('segment')) ? (params.get('segment') as BuyerSegment) : 'all'
  const q = params.get('q') ?? ''
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [search, setSearch] = useState(q)
  const [trackOpen, setTrackOpen] = useState(false)
  const [track, setTrack] = useState('')
  const [trackError, setTrackError] = useState<string | null>(null)

  const buyer = session.status === 'authenticated' && session.role === 'buyer'

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

  // Typing updates the field at once and the URL (and the request) after 300ms.
  useEffect(() => setSearch(q), [q])
  useEffect(() => {
    if (search === q) return
    const id = window.setTimeout(() => update({ q: search.trim() || null, page: null }), 300)
    return () => window.clearTimeout(id)
  })

  const query = useOrders(
    { ...FILTER[segment], q: q || undefined, page, pageSize: PAGE_SIZE },
    { enabled: buyer },
  )
  const list = query.data
  const counts = list?.segmentCounts
  const allOrders = counts ? Object.values(counts).reduce((a, b) => a + b, 0) : undefined
  const segmentCount: Record<BuyerSegment, number | undefined> = {
    all: allOrders,
    active: counts && counts.needs_action + counts.in_transit + counts.held,
    completed: counts?.completed,
    issues: counts?.issues,
  }

  const openTrack = async () => {
    setTrackError(null)
    const parsed = parseTrackInput(track)
    if (!parsed) return setTrackError('Paste the order link from your SMS, or a reference like VK-7K3P9Q.')
    if ('orderId' in parsed) return navigate(`/order/${parsed.orderId}`)
    try {
      const id = await find.mutateAsync(parsed.reference)
      if (id) navigate(`/order/${id}`)
      else setTrackError("We can't find that order in your account.")
    } catch {
      setTrackError("We couldn't check that order. Try again.")
    }
  }

  return {
    redirect:
      session.status === 'anonymous'
        ? SIGN_IN
        : session.status === 'authenticated' && session.role === 'seller'
          ? '/seller/orders'
          : session.status === 'authenticated' && session.role === 'admin'
            ? '/admin'
            : null,
    segments: SEGMENTS.map((s) => ({ ...s, count: segmentCount[s.value] })),
    segment,
    setSegment: (value: BuyerSegment) => update({ segment: value === 'all' ? null : value, page: null }),
    search,
    setSearch,
    clearSearch: () => {
      setSearch('')
      update({ q: null, page: null })
    },
    q,
    cards: (list?.items ?? []).map(toBuyerCard),
    serverOffsetMs: list?.serverOffsetMs ?? 0,
    page,
    pageCount: list ? Math.max(1, Math.ceil(list.total / PAGE_SIZE)) : 1,
    setPage: (next: number) => update({ page: next > 1 ? String(next) : null }),
    state: list
      ? allOrders === 0
        ? ('no_orders' as const)
        : list.items.length === 0
          ? q
            ? ('no_results' as const)
            : ('segment_empty' as const)
          : ('ready' as const)
      : query.isError
        ? ('error' as const)
        : ('loading' as const),
    retry: () => void query.refetch(),
    staleSince: !online && list ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    trackOpen,
    setTrackOpen: (open: boolean) => {
      setTrackOpen(open)
      if (!open) setTrackError(null)
    },
    track,
    setTrack,
    trackError,
    finding: find.isPending,
    openTrack: () => void openTrack(),
    signOut: () => signOut.mutate(undefined, { onSettled: () => navigate('/', { replace: true }) }),
    signingOut: signOut.isPending,
  }
}
