import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/models/api/errors'
import { getAvailableActions } from '@/models/domain/actions'
import { currentDeadline } from '@/models/domain/deadlines'
import { ISSUE_CATEGORIES } from '@/models/domain/listing'
import type { DisputeCategory, Order } from '@/models/domain/order'
import { useListing } from '@/models/queries/listings'
import { useOrder, useReportIssue as useReportMutation } from '@/models/queries/orders'
import { useOnline } from './useOnline'

export const DESCRIPTION_MIN = 20
export const DESCRIPTION_MAX = 500

const DISPUTE_STATES = new Set([
  'disputed_functional',
  'return_in_transit',
  'return_received',
  'awaiting_buyer_reconfirmation',
  'escalated_admin_review',
])

const RESOLUTION_STEP: Record<string, string> = {
  refund: 'The seller refunds you',
  repair: 'The seller repairs it',
  replacement: 'The seller replaces it',
}

export type ReportGate = 'form' | 'closed' | 'not_eligible' | 'already_reported'

/** Whether the buyer may report now (design/B5-report-issue, States). */
export function reportGate(order: Pick<Order, 'status' | 'listing'>): ReportGate {
  if (!order.listing.isSerialized) return 'not_eligible'
  if (DISPUTE_STATES.has(order.status)) return 'already_reported'
  return getAvailableActions('buyer', order).includes('report_problem') ? 'form' : 'closed'
}

export interface ReportErrors {
  category?: string
  description?: string
  confirmed?: string
}

export function validateReport(input: {
  category: DisputeCategory | undefined
  description: string
  confirmed: boolean
}): ReportErrors {
  const errors: ReportErrors = {}
  const length = input.description.trim().length
  if (!input.category) errors.category = 'Choose the problem.'
  if (length < DESCRIPTION_MIN)
    errors.description = `Tell us a bit more: at least ${DESCRIPTION_MIN} characters.`
  else if (length > DESCRIPTION_MAX) errors.description = `Keep it under ${DESCRIPTION_MAX} characters.`
  if (input.category !== 'other' && !input.confirmed)
    errors.confirmed = 'Confirm that you will send the item back.'
  return errors
}

/** "What happens next" for a category and the seller's declared resolution. */
export function nextSteps(category: DisputeCategory | undefined, resolution: string | undefined) {
  if (category === 'other')
    return ['Vekro support reviews your report', 'Support decides what happens to the money']
  return [
    'Send the item back',
    'The seller checks it',
    RESOLUTION_STEP[resolution ?? ''] ?? 'The seller resolves it',
  ]
}

/** B5 Report an issue (design/B5-report-issue). Route /order/:orderId/report. */
export function useReportIssue(orderId: string) {
  const navigate = useNavigate()
  const online = useOnline()
  const query = useOrder(orderId)
  const order = query.data
  const listing = useListing(order?.listing.id ?? '', { enabled: Boolean(order) })
  const report = useReportMutation(orderId)
  const [category, setCategory] = useState<DisputeCategory | undefined>()
  const [description, setDescription] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [tried, setTried] = useState(false)
  const [submitted, setSubmitted] = useState<DisputeCategory | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const errors = validateReport({ category, description, confirmed })
  const uniqueId = listing.data?.uniqueId ?? null
  const deadline = order ? currentDeadline(order) : null

  const state = submitted
    ? ('success' as const)
    : order
      ? reportGate(order)
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
    item: order
      ? {
          title: order.listing.title,
          photoUrl: listing.data?.photoUrls[0] ?? null,
          serialTail: uniqueId ? uniqueId.replace(/\s+/g, '').slice(-4) : null,
          sellerName: order.seller.name,
          amount: order.amount,
          reference: order.reference,
        }
      : null,
    deadline: deadline && order ? { ...deadline, serverOffsetMs: order.serverOffsetMs } : null,
    categories: ISSUE_CATEGORIES,
    covered: order?.listing.policy.acceptedProblems ?? [],
    category,
    setCategory,
    description,
    setDescription,
    descriptionLength: description.trim().length,
    confirmed,
    setConfirmed,
    needsConfirm: category !== 'other',
    steps: nextSteps(category, order?.listing.policy.resolution),
    errors: tried ? errors : {},
    submitError,
    submitting: report.isPending,
    submitted,
    submit: async () => {
      setTried(true)
      setSubmitError(null)
      if (!category || Object.keys(errors).length > 0) return
      try {
        await report.mutateAsync({ category, description: description.trim() })
        setSubmitted(category)
      } catch (error) {
        setSubmitError(
          error instanceof ApiError && error.kind === 'conflict'
            ? 'The reporting window has closed, or this order changed. Check your order.'
            : error instanceof ApiError && error.kind === 'network'
              ? "You're offline. Your report is still here; send it when you're back online."
              : "We couldn't send your report. Try again.",
        )
      }
    },
    back: () => navigate(`/order/${orderId}`),
    toReturn: () => navigate(`/order/${orderId}/return`, { replace: true }),
    go: (to: string) => navigate(to),
  }
}
