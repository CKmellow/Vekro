import { formatEat } from '@/lib/time'
import { NEED_COPY } from '@/models/domain/buyerHome'
import { currentDeadline } from '@/models/domain/deadlines'
import { useBuyerHome as useBuyerHomeQuery } from '@/models/queries/buyer'
import { toBuyerCard, type BuyerOrderCard } from './useMyOrders'
import { useOnline } from './useOnline'
import { useSession } from './useSession'
import { hasStore } from '@/models/domain/roleHome'

export interface NeedCard {
  id: string
  title: string
  item: string
  reference: string
  amount: number
  action: { label: string; to: string }
  countdown: { at: string; totalMs: number; label: string } | null
}

/** B10 Home (design/B10-buyer-home). Route /buyer. */
export function useBuyerHome() {
  const session = useSession()
  const online = useOnline()
  const query = useBuyerHomeQuery()
  const data = query.data
  const needs: NeedCard[] = (data?.needsYou ?? []).map((need) => {
    const copy = NEED_COPY[need.kind]
    const deadline = currentDeadline(need.order)
    return {
      id: need.order.id,
      title: copy.title,
      item: need.order.listing.title,
      reference: need.order.reference,
      amount: need.order.amount,
      action: { label: copy.action, to: copy.path(need.order.id) },
      countdown:
        copy.countdown && deadline
          ? { at: deadline.at, totalMs: deadline.totalMs, label: copy.countdown }
          : null,
    }
  })
  const recent: BuyerOrderCard[] = (data?.recent ?? []).map(toBuyerCard)
  const firstName = session.status === 'authenticated' ? (session.user.name.split(' ')[0] ?? '') : ''

  return {
    firstName,
    needs,
    recent,
    serverOffsetMs: data?.serverOffsetMs ?? 0,
    showStartSelling: session.status === 'authenticated' && !hasStore(session.account),
    state: data
      ? recent.length === 0
        ? ('no_orders' as const)
        : ('ready' as const)
      : query.isError
        ? ('error' as const)
        : ('loading' as const),
    retry: () => void query.refetch(),
    staleSince: !online && data ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
  }
}
