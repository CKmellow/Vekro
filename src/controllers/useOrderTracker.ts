import { useNavigate } from 'react-router'
import type { LockRingState, StatusView, Tone } from '@/lib/status'
import { formatEat } from '@/lib/time'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { getAvailableActions } from '@/models/domain/actions'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import type { Order } from '@/models/domain/order'
import { STATE_META, statusView, type TransactionStatus } from '@/models/domain/stateMeta'
import { useOrder } from '@/models/queries/orders'
import { useOnline } from './useOnline'

const ACTIVE_POLL_MS = 15_000

export type NextStepTone = Extract<Tone, 'emerald' | 'saffron' | 'coral' | 'plum' | 'lake'>
export type MoneyAt = 'buyer' | 'vault' | 'seller'

export interface NextStep {
  tone: NextStepTone
  title: string
  body: string
  deadline: (Deadline & { label: string }) | null
}

export interface DockAction {
  label: string
  variant: 'primary' | 'danger'
  to: string
}

const DEADLINE_LABEL: Record<Deadline['kind'], string> = {
  dispatch: 'Time left to dispatch',
  inspect: 'Time left to inspect',
  hold: 'Time left to report',
  return_send: 'Time left to send it back',
  return_confirm: 'Time left for the seller to confirm',
}

const DISPUTE: TransactionStatus[] = [
  'disputed_functional',
  'return_in_transit',
  'return_received',
  'awaiting_buyer_reconfirmation',
]

/** The next-step card for each state (design/B3-order-tracker, state panels). */
export function nextStep(order: Order): NextStep {
  const amount = `KES ${order.amount.toLocaleString('en-KE')}`
  const deadline = currentDeadline(order)
  const withDeadline = deadline ? { ...deadline, label: DEADLINE_LABEL[deadline.kind] } : null
  const step = (tone: NextStepTone, title: string, body: string, timed = false): NextStep => ({
    tone,
    title,
    body,
    deadline: timed ? withDeadline : null,
  })
  switch (order.status) {
    case 'initiated':
    case 'awaiting_payment':
      return step(
        'saffron',
        'Finish paying to lock your order',
        'Your order is saved. Pay to put the money in the vault.',
      )
    case 'locked':
      return step(
        'emerald',
        'Waiting for the seller to dispatch',
        "If it isn't sent within 48 hours, you get an automatic refund.",
        true,
      )
    case 'out_for_delivery':
    case 'dispatched':
      return step(
        'lake',
        'Waiting for the courier',
        "When the courier reaches you, the seller marks the item as arrived and you'll get a text to inspect it.",
      )
    case 'at_door_pending_inspection':
      return step(
        'saffron',
        'Your item has arrived',
        'You have about 1 hour to check it before you decide.',
        true,
      )
    case 'hold_24h':
      return step(
        'saffron',
        'Funds held for 24 hours',
        'Test your item. Report a problem before the timer ends, or the seller is paid.',
        true,
      )
    case 'disputed_functional':
      return step(
        'coral',
        'Send the item back to the seller',
        'Your report is in. Return the item so the seller can fix it.',
        true,
      )
    case 'return_in_transit':
      return step('lake', 'Your item is on its way back', 'The seller confirms when it arrives.', true)
    case 'return_received':
      return step(
        'lake',
        'The seller has your item',
        "They'll choose refund, repair or replacement, as their policy says.",
      )
    case 'awaiting_buyer_reconfirmation':
      return step('saffron', 'Is it fixed?', 'The seller says the problem is sorted. Check and tell us.')
    case 'escalated_admin_review':
      return step(
        'plum',
        'Vekro support is reviewing this',
        "We'll message you by SMS. Your money stays in the vault until it's decided.",
      )
    case 'released':
    case 'resolved_release':
      return step('emerald', 'All done', 'You accepted the item and the seller has been paid.')
    case 'refunded_buyer':
    case 'resolved_refund':
    case 'returned_to_seller':
      return step(
        'emerald',
        'Your refund is on its way',
        `${amount} is going back to ${order.buyer.phoneMasked ?? 'your M-Pesa number'} by M-Pesa.`,
      )
    case 'resolved_split':
      return step(
        'plum',
        'Settled by Vekro support',
        'Vekro support divided the payment. Check your SMS for the details.',
      )
  }
}

/** The one state-driven action, from getAvailableActions (B3 dock). */
export function dockAction(order: Order): DockAction | null {
  const base = `/order/${order.id}`
  const [action] = getAvailableActions('buyer', order)
  if (action === 'pay') return { label: 'Pay now', variant: 'primary', to: `${base}/payment` }
  if (action === 'accept_with_code')
    return { label: 'Inspect and confirm', variant: 'primary', to: `${base}/inspect` }
  if (action === 'report_problem')
    return { label: 'Report a problem', variant: 'danger', to: `${base}/report` }
  if (DISPUTE.includes(order.status)) return { label: 'Continue', variant: 'primary', to: `${base}/return` }
  return null
}

export function moneyAt(status: TransactionStatus): MoneyAt {
  if (status === 'initiated' || status === 'awaiting_payment') return 'buyer'
  if (status === 'released' || status === 'resolved_release') return 'seller'
  if (STATE_META[status].ring === 'refunded' || STATE_META[status].ring === 'returned') return 'buyer'
  return 'vault'
}

/** Paid, On the way, At your door, Inspected, (Held 24h), Complete. */
export function progress(order: Order): { steps: string[]; current: number } | null {
  const steps = [
    'Paid',
    'On the way',
    'At your door',
    'Inspected',
    ...(order.listing.isSerialized ? ['Held 24h'] : []),
    'Complete',
  ]
  const at = (name: string) => steps.indexOf(name)
  const s = order.status
  if (s === 'initiated' || s === 'awaiting_payment') return { steps, current: 0 }
  if (s === 'locked' || s === 'out_for_delivery' || s === 'dispatched')
    return { steps, current: at('On the way') }
  if (s === 'at_door_pending_inspection') return { steps, current: at('At your door') }
  if (s === 'hold_24h' || DISPUTE.includes(s) || s === 'escalated_admin_review')
    return { steps, current: at(order.listing.isSerialized ? 'Held 24h' : 'Inspected') }
  if (s === 'released' || s === 'resolved_release') return { steps, current: steps.length }
  return null
}

const AMOUNT_LABEL: Partial<Record<LockRingState, string>> = {
  open: 'Your money',
  released: 'Paid to the seller',
  refunded: 'Coming back to you',
  returned: 'Coming back to you',
}

/** B3 Order tracker (design/B3-order-tracker). */
export function useOrderTracker(orderId: string) {
  const navigate = useNavigate()
  const online = useOnline()
  const query = useOrder(orderId, {
    refetchInterval: (order) => (order && STATE_META[order.status].final ? false : ACTIVE_POLL_MS),
  })
  const order = query.data
  const meta = order ? STATE_META[order.status] : null

  const state = order
    ? ('ready' as const)
    : query.isPending
      ? ('loading' as const)
      : query.error instanceof ApiError &&
          (query.error.kind === 'not_found' || query.error.kind === 'unauthorized')
        ? ('not_found' as const)
        : ('error' as const)

  return {
    state,
    retry: () => void query.refetch(),
    online,
    /** Offline with data: show it dimmed with the time it was fetched (EAT). */
    staleSince: !online && order ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    order:
      order && meta
        ? {
            id: order.id,
            reference: order.reference,
            amount: order.amount,
            amountLabel: AMOUNT_LABEL[meta.ring] ?? 'Held safely',
            status: statusView(order.status, 'buyer') as StatusView,
            ring: meta.ring,
            title: order.listing.title,
            price: order.listing.price,
            sellerName: order.seller.name,
            simulated: order.simulated,
            serverOffsetMs: order.serverOffsetMs,
            moneyAt: moneyAt(order.status),
            next: nextStep(order),
            progress: progress(order),
            dock: dockAction(order),
          }
        : null,
    go: (to: string) => navigate(to),
    copyReference: async () => {
      if (!order) return
      try {
        await navigator.clipboard.writeText(order.reference)
        toast.show('Reference copied', 'success')
      } catch {
        toast.show(`Your reference is ${order.reference}`, 'info')
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
