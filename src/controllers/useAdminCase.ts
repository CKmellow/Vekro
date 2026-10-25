import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import type { TimelineEntry } from '@/lib/timeline'
import { formatEatFull } from '@/lib/time'
import { toast } from '@/lib/toast'
import { toPolicy } from '@/models/api/adapters/listings'
import { ApiError } from '@/models/api/errors'
import { caseAge, type AdminCaseDetail, type AdminDecision } from '@/models/domain/adminCase'
import { issueLabel, sellerOptions } from '@/models/domain/listing'
import { useCase, useDecideCase } from '@/models/queries/admin'
import { shortCaseId, toQueueRow } from './useAdminQueue'

export const REASON_MIN = 20
export const REASON_MAX = 1000

const ACTION: Record<string, string> = {
  refund_issued: 'Refunded the buyer',
  repair_shipped: 'Sent a repair',
  replacement_shipped: 'Sent a replacement',
}
const OPTION: Record<string, string> = {
  refund_issued: 'Refund',
  repair_shipped: 'Repair then release',
  replacement_shipped: 'Replacement',
}

const kes = (n: number) => `KES ${n.toLocaleString('en-KE')}`

/** The outcome in words, as the confirmation restates it. */
export function outcomeSentence(
  decision: AdminDecision,
  c: Pick<AdminCaseDetail, 'amount' | 'buyerName' | 'sellerName'>,
  sellerAmount: number,
): string {
  if (decision === 'refund')
    return `Refund ${kes(c.amount)} to ${c.buyerName}. ${c.sellerName} receives nothing.`
  if (decision === 'release')
    return `Release ${kes(c.amount)} to ${c.sellerName}. ${c.buyerName} receives nothing.`
  return `${c.buyerName} receives ${kes(c.amount - sellerAmount)} and ${c.sellerName} receives ${kes(sellerAmount)}.`
}

export function splitError(amount: number, sellerAmount: number): string | undefined {
  if (!Number.isInteger(sellerAmount) || sellerAmount < 1 || sellerAmount > amount - 1)
    return `Each side must get between KES 1 and ${kes(amount - 1)}.`
  return undefined
}

/** A3 Case detail and decision (design/A3-case). Route /admin/cases/:id. */
export function useAdminCase() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const query = useCase(id)
  const decide = useDecideCase(id)
  const c = query.data
  const [decision, setDecision] = useState<AdminDecision | undefined>()
  const [sellerAmount, setSellerAmount] = useState<number | null>(null)
  const [reason, setReason] = useState('')
  const [tried, setTried] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [typed, setTyped] = useState('')
  const [failure, setFailure] = useState<string | null>(null)
  const [splitUnsupported, setSplitUnsupported] = useState(false)

  const amount = c?.amount ?? 0
  const seller = sellerAmount ?? Math.round(amount / 2)
  const reasonLength = reason.trim().length
  const errors = {
    decision: decision ? undefined : 'Choose a decision.',
    reason:
      reasonLength < REASON_MIN
        ? `Write at least ${REASON_MIN} characters. Both parties will read it.`
        : reasonLength > REASON_MAX
          ? `Keep it under ${REASON_MAX} characters.`
          : undefined,
    split: decision === 'split' ? splitError(amount, seller) : undefined,
  }
  const valid = !errors.decision && !errors.reason && !errors.split
  const caseId = c ? shortCaseId(c.disputeId) : ''

  const state = c
    ? ('ready' as const)
    : query.isPending
      ? ('loading' as const)
      : query.error instanceof ApiError && query.error.kind === 'not_found'
        ? ('not_found' as const)
        : ('error' as const)

  const execute = async () => {
    if (!c || !decision) return
    setFailure(null)
    try {
      await decide.mutateAsync({
        decision,
        reason: reason.trim(),
        sellerShare: decision === 'split' ? Number((seller / amount).toFixed(4)) : undefined,
      })
      toast.show('Decision recorded. Payouts are on their way.', 'success')
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'conflict' && decision === 'split') {
        setSplitUnsupported(true)
        setDecision(undefined)
      } else
        setFailure(
          error instanceof ApiError && error.message
            ? `The decision didn't go through: ${error.message}`
            : "The decision didn't go through. Nothing was moved.",
        )
    } finally {
      setConfirming(false)
      setTyped('')
    }
  }

  return {
    state,
    retry: () => void query.refetch(),
    back: () => navigate('/admin'),
    caseView: c
      ? {
          caseId,
          disputeId: c.disputeId,
          reference: c.reference,
          amount: c.amount,
          trigger: toQueueRow(c).trigger,
          age: caseAge(c.escalatedAt),
          itemTitle: c.itemTitle,
          serial: c.uniqueId,
          isSerialized: c.isSerialized,
          policy: sellerOptions(toPolicy(c.policy)).map((a) => OPTION[a] ?? a),
          buyer: { ...c.buyer, tel: `tel:${c.buyer.phone}` },
          seller: { ...c.seller, tel: `tel:${c.seller.phone}` },
          buyerSays: { category: issueLabel(c.category), description: c.description, note: c.buyerNotes },
          sellerSays: c.sellerAction
            ? { action: ACTION[c.sellerAction] ?? c.sellerAction, note: c.sellerNotes }
            : null,
          escalation: c.escalationReason
            ? { by: c.escalatedBy === 'buyer' ? 'The buyer' : 'The seller', reason: c.escalationReason }
            : null,
          timeline: [...c.timeline].reverse().map((e, i): TimelineEntry => ({
            id: `${e.at}-${i}`,
            time: formatEatFull(e.at),
            actor: e.source === 'support' ? 'support' : e.source === 'dispute' ? 'vekro' : undefined,
            text: e.title,
            detail: e.message || undefined,
          })),
          decided: c.decided
            ? {
                sentence: outcomeSentence(
                  c.decided.decision,
                  c,
                  Math.round(c.amount * (c.decided.sellerShare ?? 0.5)),
                ),
                reason: c.decided.reason,
                by: c.decided.decidedBy ?? 'Vekro support',
                at: c.decided.decidedAt ? formatEatFull(c.decided.decidedAt) : null,
                moneyAt:
                  c.decided.decision === 'refund'
                    ? ('buyer' as const)
                    : c.decided.decision === 'release'
                      ? ('seller' as const)
                      : ('vault' as const),
              }
            : null,
        }
      : null,
    decision,
    setDecision: (value: AdminDecision) => {
      setDecision(value)
      setFailure(null)
    },
    splitUnsupported,
    seller,
    buyer: amount - seller,
    setSellerAmount: (value: number) => setSellerAmount(Math.round(value)),
    setBuyerAmount: (value: number) => setSellerAmount(Math.round(amount - value)),
    reason,
    setReason,
    reasonLength,
    errors: tried ? errors : ({} as Partial<typeof errors>),
    review: () => {
      setTried(true)
      if (valid) setConfirming(true)
    },
    confirming,
    cancelConfirm: () => {
      if (!decide.isPending) {
        setConfirming(false)
        setTyped('')
      }
    },
    sentence: c && decision ? outcomeSentence(decision, c, seller) : '',
    typed,
    setTyped,
    typedOk: typed.trim().toUpperCase() === caseId,
    executing: decide.isPending,
    execute,
    failure,
  }
}
