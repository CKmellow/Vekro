import { useNavigate } from 'react-router'
import type { TimelineActor, TimelineEntry } from '@/lib/timeline'
import { formatEat } from '@/lib/time'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import type { TimelineEvent } from '@/models/api/transactions'
import { currentDeadline } from '@/models/domain/deadlines'
import type { Order } from '@/models/domain/order'
import { statusView } from '@/models/domain/stateMeta'
import { useOrder, useOrderTimeline } from '@/models/queries/orders'

const ACTORS: Record<string, TimelineActor> = {
  transaction_created: 'you',
  transaction_locked: 'vekro',
  transaction_dispatched: 'seller',
  delivery_arrived: 'seller',
  otp_given: 'you',
  otp_withheld: 'you',
  dispute_opened: 'you',
  dispute_updated: 'vekro',
  system_timeout: 'vekro',
  admin_decision: 'support',
}

/** The seller's side of the same events: they are "You" and the buyer is "Buyer". */
const SELLER_VIEW: Record<TimelineActor, TimelineActor> = {
  you: 'buyer',
  buyer: 'buyer',
  seller: 'you',
  vekro: 'vekro',
  support: 'support',
}

/** What comes next, dashed, with its deadline (server time) when one runs. Worded for the viewer. */
export function upcomingSteps(order: Order, now = new Date()): TimelineEntry[] {
  const deadline = currentDeadline(order)
  const by = deadline ? `By ${formatEat(deadline.at, now)}` : undefined
  const step = (text: string, time?: string): TimelineEntry => ({
    id: `next-${text}`,
    text,
    time,
    upcoming: true,
  })
  if (order.viewerRole !== 'buyer') {
    switch (order.status) {
      case 'initiated':
      case 'awaiting_payment':
        return [step('The buyer pays with M-Pesa')]
      case 'locked':
        return [step('Dispatch the order, or the buyer is refunded', by)]
      case 'out_for_delivery':
        return [step("Mark the item arrived when the courier reaches the buyer's door")]
      case 'at_door_pending_inspection':
        return [step('The buyer accepts with their code or rejects. If they do neither, it comes back', by)]
      case 'hold_24h':
        return [step("You're paid when the hold ends, unless the buyer reports a problem", by)]
      default:
        return []
    }
  }
  switch (order.status) {
    case 'initiated':
    case 'awaiting_payment':
      return [step('Pay with M-Pesa to lock the order')]
    case 'locked':
      return [step('The seller dispatches your order, or you are refunded', by)]
    case 'out_for_delivery':
    case 'dispatched':
      return [step('The courier reaches you and you inspect the item')]
    case 'at_door_pending_inspection':
      return [
        step(
          'Decide: give your code to release payment, or reject. If you do neither, the item goes back',
          by,
        ),
      ]
    case 'hold_24h':
      return [step('Report a problem before the hold ends, or the seller is paid', by)]
    default:
      return []
  }
}

export function toEntries(
  events: TimelineEvent[],
  now = new Date(),
  viewer: Order['viewerRole'] = 'buyer',
): TimelineEntry[] {
  return events
    .map((event, i) => {
      const actor = ACTORS[event.kind] ?? 'vekro'
      return { event, i, actor: viewer === 'buyer' ? actor : SELLER_VIEW[actor] }
    })
    .map(({ event, i, actor }) => ({
      id: `${event.kind}-${i}`,
      time: formatEat(event.at, now),
      actor,
      text: event.title,
      detail: event.description,
    }))
    .reverse()
}

/** B7 Transaction timeline (PAGES.md B7). Also the Timeline tab of B3. */
export function useOrderTimelineView(orderId: string) {
  const navigate = useNavigate()
  const order = useOrder(orderId)
  const timeline = useOrderTimeline(orderId, {
    enabled: Boolean(order.data),
    updatedAt: order.data?.updatedAt,
  })
  const failed = order.error ?? timeline.error

  return {
    state:
      order.data && timeline.data
        ? ('ready' as const)
        : failed instanceof ApiError && failed.kind === 'not_found'
          ? ('not_found' as const)
          : failed
            ? ('error' as const)
            : ('loading' as const),
    retry: () => {
      void order.refetch()
      void timeline.refetch()
    },
    summary: order.data
      ? {
          reference: order.data.reference,
          amount: order.data.amount,
          status: statusView(order.data.status, order.data.viewerRole),
        }
      : null,
    entries:
      order.data && timeline.data
        ? [...upcomingSteps(order.data), ...toEntries(timeline.data, new Date(), order.data.viewerRole)]
        : [],
    back: () => navigate(`/order/${orderId}`),
    copyLink: async () => {
      try {
        await navigator.clipboard.writeText(window.location.href)
        toast.show('Link copied', 'success')
      } catch {
        toast.show("Couldn't copy the link", 'danger')
      }
    },
  }
}
