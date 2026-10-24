import { useState } from 'react'
import { useNavigate } from 'react-router'
import type { LockRingState, StatusView, Tone } from '@/lib/status'
import { formatEat, formatEatFull } from '@/lib/time'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { getAvailableActions } from '@/models/domain/actions'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import { issueLabel } from '@/models/domain/listing'
import type { Order } from '@/models/domain/order'
import { STATE_META, statusView, type TransactionStatus } from '@/models/domain/stateMeta'
import { useConfirmResolved, useMarkSentBack, useOrder, useReconfirm } from '@/models/queries/orders'
import { useOnline } from './useOnline'

const POLL_MS = 15_000

const RETURN_STATES: TransactionStatus[] = [
  'disputed_functional',
  'return_in_transit',
  'return_received',
  'awaiting_buyer_reconfirmation',
  'escalated_admin_review',
  'refunded_buyer',
  'resolved_refund',
  'resolved_release',
  'resolved_split',
]

/** The backend escalates the second "not fixed" (BUYER_RECONFIRMATION_RETRY_LIMIT = 1). */
export const RECONFIRM_RETRIES = 1

const ACTION: Record<string, string> = {
  repair_shipped: 'The seller sent a repair',
  replacement_shipped: 'The seller sent a replacement',
  refund_issued: 'The seller refunded you',
}
const RESOLUTION: Record<string, string> = {
  refund: 'Refund',
  repair: 'Repair then release',
  replacement: 'Replacement',
}

export interface ReturnPanel {
  tone: Extract<Tone, 'coral' | 'lake' | 'saffron' | 'emerald' | 'plum'>
  title: string
  body: string
  quote?: string
  deadline: (Deadline & { label: string }) | null
}

/** The state panel for each return status (design/B6-return-flow, State panels). */
export function returnPanel(order: Order): ReturnPanel {
  const deadline = currentDeadline(order)
  const timed = (label: string) => (deadline ? { ...deadline, label } : null)
  const kes = `KES ${order.amount.toLocaleString('en-KE')}`
  switch (order.status) {
    case 'disputed_functional':
      return {
        tone: 'coral',
        title: 'Send the item back',
        body: "You have about 3 days. Tap the button once it's on its way.",
        deadline: timed('Time left to send it back'),
      }
    case 'return_in_transit':
      return {
        tone: 'lake',
        title: 'On its way back',
        body: "Waiting for the seller to confirm they got it. If they don't within about 3 days, Vekro support steps in.",
        deadline: timed('Time left for the seller to confirm'),
      }
    case 'return_received':
      return {
        tone: 'lake',
        title: 'The seller has your item',
        body: "They'll refund, repair or replace it, as their policy says.",
        deadline: null,
      }
    case 'awaiting_buyer_reconfirmation':
      return {
        tone: 'saffron',
        title: 'Is it fixed?',
        body: ACTION[order.dispute?.sellerAction ?? ''] ?? 'The seller says the problem is sorted.',
        quote: order.dispute?.sellerNotes ?? undefined,
        deadline: null,
      }
    case 'escalated_admin_review':
      return {
        tone: 'plum',
        title: 'Vekro support is reviewing this',
        body: "We'll message you by SMS. Your money stays in the vault until it's decided.",
        deadline: null,
      }
    case 'refunded_buyer':
    case 'resolved_refund':
      return {
        tone: 'emerald',
        title: `Refund issued: ${kes}`,
        body: `It's going back to ${order.buyer.phoneMasked ?? 'your M-Pesa number'} by M-Pesa.`,
        deadline: null,
      }
    case 'resolved_release':
      return {
        tone: 'emerald',
        title: 'Sorted',
        body: 'You confirmed it works and the seller has been paid.',
        deadline: null,
      }
    default:
      return {
        tone: 'plum',
        title: 'Settled by Vekro support',
        body: 'Check your SMS for how the payment was divided.',
        deadline: null,
      }
  }
}

/** Reported, Sent back, Seller has it, Resolved. */
export function returnStep(status: TransactionStatus): number {
  if (status === 'disputed_functional') return 0
  if (status === 'return_in_transit') return 1
  if (
    status === 'return_received' ||
    status === 'awaiting_buyer_reconfirmation' ||
    status === 'escalated_admin_review'
  )
    return 2
  return 4
}

const RING: Partial<Record<TransactionStatus, LockRingState>> = {
  disputed_functional: 'coral',
  return_in_transit: 'lake',
  return_received: 'lake',
  awaiting_buyer_reconfirmation: 'pulse',
  escalated_admin_review: 'plum',
}

export type ReturnDialog = 'sent_back' | 'fixed' | 'not_fixed' | null

/** B6 Return flow (design/B6-return-flow). Route /order/:orderId/return. */
export function useReturnFlow(orderId: string) {
  const navigate = useNavigate()
  const online = useOnline()
  const query = useOrder(orderId, {
    refetchInterval: (order) => (order && STATE_META[order.status].final ? false : POLL_MS),
  })
  const order = query.data
  const sentBack = useMarkSentBack(orderId)
  const reconfirm = useReconfirm(orderId)
  const confirmResolved = useConfirmResolved(orderId, 'buyer')
  const [dialog, setDialog] = useState<ReturnDialog>(null)

  const run = async (step: () => Promise<unknown>, done: string) => {
    try {
      await step()
      toast.show(done, 'success')
    } catch (error) {
      const conflict = error instanceof ApiError && error.kind === 'conflict'
      toast.show(
        conflict ? "This case changed. Here's the latest." : "That didn't go through. Try again.",
        conflict ? 'info' : 'danger',
      )
    } finally {
      setDialog(null)
    }
  }

  const actions = order ? getAvailableActions('buyer', order) : []
  const dispute = order?.dispute ?? null
  const lastChance = (dispute?.reconfirmRejections ?? 0) >= RECONFIRM_RETRIES

  const state = order
    ? RETURN_STATES.includes(order.status)
      ? ('ready' as const)
      : ('not_a_return' as const)
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
    staleSince: !online && order ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    order: order
      ? {
          id: order.id,
          reference: order.reference,
          amount: order.amount,
          status: statusView(order.status, 'buyer') as StatusView,
          ring: RING[order.status] ?? STATE_META[order.status].ring,
          step: returnStep(order.status),
          serverOffsetMs: order.serverOffsetMs,
          panel: returnPanel(order),
          sendingBack: order.status === 'disputed_functional',
          escalated: order.status === 'escalated_admin_review',
          summary: dispute
            ? {
                category: issueLabel(dispute.category),
                description: dispute.description,
                reported: formatEatFull(dispute.openedAt),
              }
            : null,
          policy: order.listing.policy.resolution ? RESOLUTION[order.listing.policy.resolution] : null,
          sellerName: order.seller.name,
          closure:
            dispute && ['resolved_release', 'resolved_refund', 'resolved_split'].includes(order.status)
              ? { you: dispute.buyerConfirmedResolved, seller: dispute.sellerConfirmedResolved }
              : null,
        }
      : null,
    can: {
      sendBack: actions.includes('mark_sent_back'),
      reconfirm: actions.includes('reconfirm'),
      confirmResolved: actions.includes('confirm_resolved'),
    },
    lastChance,
    dialog,
    setDialog,
    busy: sentBack.isPending || reconfirm.isPending || confirmResolved.isPending,
    confirmSentBack: () => run(() => sentBack.mutateAsync(), 'The seller knows it is on its way'),
    confirmFixed: () =>
      run(() => reconfirm.mutateAsync({ accepted: true, notes: null }), 'Thanks. The seller has been paid.'),
    confirmNotFixed: (notes: string) =>
      run(
        () => reconfirm.mutateAsync({ accepted: false, notes: notes.trim() || null }),
        lastChance ? 'Sent to Vekro support' : 'Sent back to the seller to sort out',
      ),
    markResolved: () => run(() => confirmResolved.mutateAsync(), 'Marked as resolved'),
    back: () => navigate(`/order/${orderId}`),
    toTracker: () => navigate(`/order/${orderId}`, { replace: true }),
    help: () => navigate('/help'),
  }
}
