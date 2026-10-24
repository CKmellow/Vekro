import { useParams } from 'react-router'
import { payoutBreakdown } from '@/lib/fees'
import type { LockRingState, StatusView, Tone } from '@/lib/status'
import { formatEat, formatEatFull } from '@/lib/time'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { getAvailableActions } from '@/models/domain/actions'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import type { Order, SellerPayout } from '@/models/domain/order'
import { STATE_META, statusView } from '@/models/domain/stateMeta'
import { useOrder } from '@/models/queries/orders'
import { useOnline } from './useOnline'
import { useOrderTransition } from './useOrderTransition'
import { moneyAt } from './useOrderTracker'

const ACTIVE_POLL_MS = 15_000

export type PanelTone = Extract<Tone, 'sand' | 'emerald' | 'saffron' | 'coral' | 'plum' | 'lake'>
export type PanelAction =
  | { kind: 'dispatch' | 'mark_arrived'; label: string }
  | { kind: 'open_case'; label: string; to: string; secondary?: boolean }

export interface ActionPanel {
  tone: PanelTone
  icon: 'clock' | 'lock' | 'truck' | 'eye' | 'hourglass' | 'alert' | 'shield' | 'check' | 'closed'
  title: string
  body: string
  warning?: string
  deadline: (Deadline & { label: string }) | null
  action: PanelAction | null
}

export interface PayoutLine {
  tone: 'emerald' | 'lake' | 'coral' | 'sand'
  icon: 'lock' | 'check' | 'loader' | 'alert' | 'coin' | 'clock'
  text: string
  reference?: string
  when?: string
}

const DEADLINE_LABEL: Record<Deadline['kind'], string> = {
  dispatch: 'Time left to dispatch',
  inspect: 'Time left for the buyer to inspect',
  hold: 'Time until you are paid',
  return_send: 'Time left for the buyer to send it back',
  return_confirm: 'Time left to confirm the return',
}

const REASON: Record<string, string> = {
  damaged: 'Damaged',
  wrong_item: 'Wrong item',
  not_as_described: 'Not as described',
  missing_parts: 'Missing parts',
  other: 'Other',
}

const kes = (amount: number) => `KES ${amount.toLocaleString('en-KE')}`

/** The action panel for each state (design/S6-order-detail, Action panel by state). */
export function actionPanel(order: Order): ActionPanel {
  const deadline = currentDeadline(order)
  const timed = deadline ? { ...deadline, label: DEADLINE_LABEL[deadline.kind] } : null
  const [allowed] = getAvailableActions('seller', order)
  const caseLink = `/seller/returns/${order.id}`
  const panel = (p: Omit<ActionPanel, 'deadline' | 'action'> & Partial<ActionPanel>): ActionPanel => ({
    deadline: null,
    action: null,
    ...p,
  })
  switch (order.status) {
    case 'initiated':
    case 'awaiting_payment':
      return panel({
        tone: 'sand',
        icon: 'clock',
        title: 'Waiting for the buyer to pay',
        body: "The order locks when the M-Pesa payment comes in. Don't send anything yet.",
      })
    case 'locked':
      return panel({
        tone: 'emerald',
        icon: 'lock',
        title: 'Ready to dispatch',
        body: 'Pack the item and hand it to your courier.',
        warning: "If you don't dispatch in time, the buyer is refunded automatically.",
        deadline: timed,
        action: allowed === 'dispatch' ? { kind: 'dispatch', label: 'Mark as dispatched' } : null,
      })
    case 'out_for_delivery':
    case 'dispatched':
      return panel({
        tone: 'lake',
        icon: 'truck',
        title: 'On the way to the buyer',
        body: 'When the courier reaches the buyer, mark the item as arrived so they can inspect it.',
        action: allowed === 'mark_arrived' ? { kind: 'mark_arrived', label: 'Mark item arrived' } : null,
      })
    case 'at_door_pending_inspection':
      return panel({
        tone: 'saffron',
        icon: 'eye',
        title: 'The buyer is inspecting',
        body: 'They have about 1 hour to accept with their code or reject. If they do nothing, the item comes back to you.',
        deadline: timed,
      })
    case 'hold_24h':
      return panel({
        tone: 'saffron',
        icon: 'hourglass',
        title: 'Funds held for 24 hours',
        body: "Unless the buyer reports a problem, you're paid when the timer ends.",
        deadline: timed,
      })
    case 'disputed_functional':
    case 'return_in_transit':
    case 'return_received':
    case 'awaiting_buyer_reconfirmation':
      return panel({
        tone: 'coral',
        icon: 'alert',
        title: 'The buyer reported a problem',
        body: 'The money stays in escrow while the return is sorted out, as your policy says.',
        deadline: timed,
        action: { kind: 'open_case', label: 'Open return case', to: caseLink },
      })
    case 'escalated_admin_review':
      return panel({
        tone: 'plum',
        icon: 'shield',
        title: 'With Vekro support',
        body: 'Support is reviewing this case. The money stays in escrow until they decide.',
        action: { kind: 'open_case', label: 'Open return case', to: caseLink, secondary: true },
      })
    case 'released':
    case 'resolved_release':
      return panel({
        tone: 'emerald',
        icon: 'check',
        title: "You've been paid",
        body: `The buyer accepted. ${kes(order.payout?.amount ?? order.amount)} is on its way to your M-Pesa.`,
      })
    case 'refunded_buyer':
    case 'resolved_refund':
    case 'returned_to_seller': {
      const reason = order.doorRejection?.reason
      const note = order.doorRejection?.note
      const why = [reason ? `Buyer's reason: ${REASON[reason] ?? reason}.` : '', note ? `"${note}"` : '']
        .filter(Boolean)
        .join(' ')
      return panel({
        tone: 'sand',
        icon: 'closed',
        title: 'Order closed',
        body: `The buyer was refunded.${why ? ` ${why}` : ''}`,
      })
    }
    case 'resolved_split':
      return panel({
        tone: 'plum',
        icon: 'shield',
        title: 'Settled by Vekro support',
        body: 'Support divided the payment. Check your notifications for the split.',
      })
  }
}

/** The payout card's status line (design/S6-order-detail, Payout card). */
export function payoutLine(payout: SellerPayout | null): PayoutLine {
  switch (payout?.status) {
    case 'not_paid':
      return { tone: 'sand', icon: 'clock', text: 'Waiting for the buyer to pay' }
    case 'in_progress':
      return { tone: 'lake', icon: 'loader', text: 'Payout in progress' }
    case 'paid_out':
      return {
        tone: 'emerald',
        icon: 'check',
        text: 'Paid out to M-Pesa',
        reference: payout.reference ?? undefined,
        when: payout.paidAt ? formatEatFull(payout.paidAt) : undefined,
      }
    case 'delayed':
      return { tone: 'coral', icon: 'alert', text: "Payout delayed. We're retrying." }
    case 'refunded':
      return { tone: 'sand', icon: 'coin', text: 'Refunded to the buyer' }
    default:
      return { tone: 'emerald', icon: 'lock', text: 'Held until the buyer accepts' }
  }
}

const AMOUNT_LABEL: Partial<Record<LockRingState, string>> = {
  open: 'Not paid yet',
  released: 'Paid out to you',
  refunded: 'Refunded to the buyer',
  returned: 'Refunded to the buyer',
}

/** S6 Order detail (design/S6-order-detail). Route /seller/orders/:id. */
export function useSellerOrder() {
  const { id = '' } = useParams()
  const online = useOnline()
  const query = useOrder(id, {
    refetchInterval: (order) => (order && STATE_META[order.status].final ? false : ACTIVE_POLL_MS),
  })
  const transition = useOrderTransition()
  const order = query.data
  const meta = order ? STATE_META[order.status] : null

  const state = order
    ? ('ready' as const)
    : query.isPending
      ? ('loading' as const)
      : query.error instanceof ApiError &&
          (query.error.kind === 'not_found' || query.error.kind === 'forbidden')
        ? ('not_yours' as const)
        : ('error' as const)

  return {
    state,
    retry: () => void query.refetch(),
    online,
    staleSince: !online && order ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    order:
      order && meta
        ? {
            id: order.id,
            reference: order.reference,
            amount: order.amount,
            amountLabel: AMOUNT_LABEL[meta.ring] ?? 'Held in escrow',
            status: statusView(order.status, 'seller') as StatusView,
            ring: meta.ring,
            moneyAt: moneyAt(order.status),
            serverOffsetMs: order.serverOffsetMs,
            simulated: order.simulated,
            buyer: order.buyer,
            item: {
              listingId: order.listing.id,
              title: order.listing.title,
              price: order.listing.price,
              isSerialized: order.listing.isSerialized,
            },
            panel: actionPanel(order),
            payout: { ...payoutBreakdown(order.amount), line: payoutLine(order.payout) },
          }
        : null,
    transition,
    runAction: (action: PanelAction) => {
      if (!order || action.kind === 'open_case') return
      transition.ask({ orderId: order.id, reference: order.reference, transition: action.kind })
    },
    copyReference: async () => {
      if (!order) return
      try {
        await navigator.clipboard.writeText(order.reference)
        toast.show('Reference copied', 'success')
      } catch {
        toast.show(`The reference is ${order.reference}`, 'info')
      }
    },
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
