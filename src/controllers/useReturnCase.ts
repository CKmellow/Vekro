import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { LockRingState, StatusView, Tone } from '@/lib/status'
import { formatEat, formatEatFull } from '@/lib/time'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { getAvailableActions } from '@/models/domain/actions'
import { currentDeadline, type Deadline } from '@/models/domain/deadlines'
import { issueLabel, sellerOptions, type SellerAction } from '@/models/domain/listing'
import type { Order } from '@/models/domain/order'
import { STATE_META, statusView, type TransactionStatus } from '@/models/domain/stateMeta'
import {
  useConfirmResolved,
  useEscalate,
  useOrder,
  useSellerReceived,
  useSellerResolution,
} from '@/models/queries/orders'
import { useOnline } from './useOnline'

const POLL_MS = 15_000
export const REASON_MIN = 20
export const REASON_MAX = 1000
export const NOTE_MAX = 500

const OPEN_CASE: TransactionStatus[] = [
  'disputed_functional',
  'return_in_transit',
  'return_received',
  'awaiting_buyer_reconfirmation',
]

export const OPTION_COPY: Record<SellerAction, { title: string; description: string }> = {
  refund_issued: {
    title: 'Refund buyer',
    description: "Sends the money back to the buyer now. This can't be undone.",
  },
  repair_shipped: {
    title: 'Repair and send back',
    description: "Fix it and return it. The buyer confirms it works before you're paid.",
  },
  replacement_shipped: {
    title: 'Send a replacement',
    description: "Send a working unit. The buyer confirms before you're paid.",
  },
}

const CHOSEN: Record<SellerAction, string> = {
  refund_issued: 'You refunded the buyer',
  repair_shipped: 'You sent a repair',
  replacement_shipped: 'You sent a replacement',
}

export interface CasePanel {
  tone: Extract<Tone, 'lake' | 'saffron' | 'emerald' | 'plum' | 'sand'>
  title: string
  body: string
  quote?: string
  deadline: (Deadline & { label: string }) | null
}

/** The action panel for each case status (design/S11-return-case). */
export function casePanel(order: Order): CasePanel {
  const deadline = currentDeadline(order)
  const timed = (label: string) => (deadline ? { ...deadline, label } : null)
  const kes = `KES ${order.amount.toLocaleString('en-KE')}`
  const action = order.dispute?.sellerAction
  switch (order.status) {
    case 'disputed_functional':
      return {
        tone: 'lake',
        title: 'Waiting for the buyer to send it back',
        body: 'They have about 3 days to send it. After that, the case moves on as if it was sent, and your receipt timer starts.',
        deadline: timed('Time left for the buyer to send it'),
      }
    case 'return_in_transit':
      return {
        tone: 'lake',
        title: 'Waiting for the item to arrive',
        body: "Check the item when it reaches you, then confirm here. If you don't confirm within about 3 days, the case goes to Vekro support.",
        deadline: timed('Time left to confirm receipt'),
      }
    case 'return_received':
      return {
        tone: 'saffron',
        title: 'Choose your resolution',
        body: 'You promised these options when you listed the item.',
        deadline: null,
      }
    case 'awaiting_buyer_reconfirmation':
      return {
        tone: 'saffron',
        title: "Waiting for the buyer to confirm it's fixed",
        body: action ? CHOSEN[action] : 'You sent a fix.',
        quote: order.dispute?.sellerNotes ?? undefined,
        deadline: null,
      }
    case 'escalated_admin_review':
      return {
        tone: 'plum',
        title: 'Vekro support is reviewing this case',
        body: "They'll decide using what you and the buyer told us. The money stays in escrow until then.",
        deadline: null,
      }
    case 'refunded_buyer':
    case 'resolved_refund':
      return { tone: 'sand', title: 'Refund issued', body: `${kes} went back to the buyer.`, deadline: null }
    case 'resolved_release':
      return {
        tone: 'emerald',
        title: 'Settled: you were paid',
        body: `${kes} was released to you.`,
        deadline: null,
      }
    default:
      return {
        tone: 'plum',
        title: 'Settled by Vekro support',
        body: 'Support divided the payment. Check your notifications for the split.',
        deadline: null,
      }
  }
}

const RING: Partial<Record<TransactionStatus, LockRingState>> = {
  disputed_functional: 'coral',
  return_in_transit: 'lake',
  return_received: 'lake',
}

export type CaseDialog = 'received' | 'refund' | 'disagree' | null

/** S11 Return case (design/S11-return-case). Route /seller/returns/:id. */
export function useReturnCase() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const online = useOnline()
  const query = useOrder(id, {
    refetchInterval: (order) => (order && STATE_META[order.status].final ? false : POLL_MS),
  })
  const order = query.data
  const received = useSellerReceived(id)
  const resolution = useSellerResolution(id)
  const closure = useConfirmResolved(id, 'seller')
  const escalation = useEscalate(id)
  const [dialog, setDialog] = useState<CaseDialog>(null)
  const [choice, setChoice] = useState<SellerAction | undefined>()
  const [note, setNote] = useState('')
  const [reason, setReason] = useState('')
  const [reasonTried, setReasonTried] = useState(false)

  const run = async (step: () => Promise<unknown>, done: string) => {
    try {
      await step()
      toast.show(done, 'success')
      return true
    } catch (error) {
      const conflict = error instanceof ApiError && (error.kind === 'conflict' || error.kind === 'validation')
      toast.show(
        conflict ? "This case changed. Here's the latest." : "That didn't go through. Try again.",
        conflict ? 'info' : 'danger',
      )
      return false
    } finally {
      setDialog(null)
    }
  }

  const actions = order ? getAvailableActions('seller', order) : []
  const dispute = order?.dispute ?? null
  const reasonLength = reason.trim().length
  const reasonError =
    reasonLength < REASON_MIN
      ? `Tell support what happened in at least ${REASON_MIN} characters.`
      : reasonLength > REASON_MAX
        ? `Keep it under ${REASON_MAX} characters.`
        : undefined

  const state = order
    ? dispute
      ? ('ready' as const)
      : ('not_a_case' as const)
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
      order && dispute
        ? {
            id: order.id,
            reference: order.reference,
            title: order.listing.title,
            amount: order.amount,
            status: statusView(order.status, 'seller') as StatusView,
            ring: RING[order.status] ?? STATE_META[order.status].ring,
            serverOffsetMs: order.serverOffsetMs,
            panel: casePanel(order),
            category: issueLabel(dispute.category),
            description: dispute.description,
            reported: formatEatFull(dispute.openedAt),
            buyerNotes: dispute.buyerNotes,
            policy: sellerOptions(order.listing.policy).map((a) => OPTION_COPY[a].title),
            options: sellerOptions(order.listing.policy).map((value) => ({ value, ...OPTION_COPY[value] })),
            closure: ['resolved_release', 'resolved_refund', 'resolved_split'].includes(order.status)
              ? { you: dispute.sellerConfirmedResolved, buyer: dispute.buyerConfirmedResolved }
              : null,
          }
        : null,
    can: {
      confirmReceived: actions.includes('confirm_return_received'),
      choose: actions.includes('choose_resolution'),
      confirmResolved: actions.includes('confirm_resolved'),
      disagree: order ? OPEN_CASE.includes(order.status) : false,
    },
    dialog,
    setDialog,
    choice,
    setChoice: (value: SellerAction) => {
      setChoice(value)
      if (value === 'refund_issued') setNote('')
    },
    note,
    setNote,
    reason,
    setReason,
    reasonLength,
    reasonError: reasonTried ? reasonError : undefined,
    busy: received.isPending || resolution.isPending || closure.isPending || escalation.isPending,
    confirmReceived: () => run(() => received.mutateAsync(), 'Marked as received'),
    confirmAction: () => {
      if (!choice) return
      if (choice === 'refund_issued') setDialog('refund')
      else
        void run(
          () => resolution.mutateAsync({ action: choice, notes: note.trim() || null }),
          'The buyer has been told',
        )
    },
    confirmRefund: () =>
      run(() => resolution.mutateAsync({ action: 'refund_issued', notes: null }), 'Refund sent to the buyer'),
    markResolved: () => run(() => closure.mutateAsync(), 'Marked as resolved'),
    sendDisagreement: async () => {
      setReasonTried(true)
      if (reasonError) return
      if (await run(() => escalation.mutateAsync(reason.trim()), 'Sent to Vekro support')) {
        setReason('')
        setReasonTried(false)
      }
    },
    toOrder: () => navigate(`/seller/orders/${id}`, { replace: true }),
  }
}
