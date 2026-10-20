import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ApiError } from '@/models/api/errors'
import { currentDeadline } from '@/models/domain/deadlines'
import { STATE_META } from '@/models/domain/stateMeta'
import { formatKes } from '@/lib/money'
import { useListing } from '@/models/queries/listings'
import { useGiveCode, useOrder } from '@/models/queries/orders'
import { useOnline } from './useOnline'

const POLL_MS = 15_000
const BEFORE_DOOR = new Set(['initiated', 'awaiting_payment', 'locked', 'out_for_delivery', 'dispatched'])
const REFUNDED = new Set(['refunded_buyer', 'resolved_refund', 'returned_to_seller'])

export type InspectionVariant = 'inspect' | 'not_yet' | 'done' | 'hold' | 'rejected' | 'timed_out' | 'other'

/** What B4 shows for a status. A refund with a stored reason was a rejection; without one, time ran out. */
export function inspectionVariant(status: string, rejected: boolean): InspectionVariant {
  if (status === 'at_door_pending_inspection') return 'inspect'
  if (BEFORE_DOOR.has(status)) return 'not_yet'
  if (status === 'released' || status === 'resolved_release') return 'done'
  if (status === 'hold_24h') return 'hold'
  if (REFUNDED.has(status)) return rejected ? 'rejected' : 'timed_out'
  return 'other'
}

/** Guidance only: nothing here is sent or required (design/B4-inspection). */
export function checklist(isSerialized: boolean, uniqueId: string | null): string[] {
  const base = [
    'Open the package in front of the courier',
    "It's the right item and matches the photos",
    'Nothing is damaged or missing',
  ]
  return isSerialized && uniqueId ? [...base, `Serial number matches ••••${uniqueId.slice(-4)}`] : base
}

/** B4 Arrival, inspection and decision (design/B4-inspection). */
export function useInspection(orderId: string) {
  const navigate = useNavigate()
  const online = useOnline()
  const query = useOrder(orderId, {
    refetchInterval: (order) => (order && STATE_META[order.status].final ? false : POLL_MS),
  })
  const order = query.data
  const listing = useListing(order?.listing.id ?? '', { enabled: Boolean(order) })
  const [checked, setChecked] = useState<Set<number>>(new Set())
  const [code, setCode] = useState('')
  const [codeError, setCodeError] = useState<string | undefined>()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const giveCode = useGiveCode(orderId)

  const accept = async () => {
    try {
      await giveCode.mutateAsync(code)
      setConfirmOpen(false)
    } catch (error) {
      setConfirmOpen(false)
      setCode('')
      if (error instanceof ApiError && error.kind === 'validation' && /otp/i.test(error.message))
        setCodeError("That code doesn't match. Check the SMS and try again.")
      else if (error instanceof ApiError && error.kind === 'network')
        setCodeError("You're offline. Your code wasn't sent; try again when you're connected.")
      else setCodeError("We couldn't confirm the code. Try again.")
    }
  }

  const items = order ? checklist(order.listing.isSerialized, listing.data?.uniqueId ?? null) : []
  const deadline = order ? currentDeadline(order) : null

  return {
    state: order
      ? ('ready' as const)
      : query.isPending
        ? ('loading' as const)
        : query.error instanceof ApiError && query.error.kind === 'not_found'
          ? ('not_found' as const)
          : ('error' as const),
    retry: () => void query.refetch(),
    online,
    variant: order ? inspectionVariant(order.status, Boolean(order.doorRejection)) : null,
    order: order
      ? {
          title: order.listing.title,
          reference: order.reference,
          amount: order.amount,
          isSerialized: order.listing.isSerialized,
          sellerName: order.seller.name,
          serverOffsetMs: order.serverOffsetMs,
        }
      : null,
    deadline: deadline?.kind === 'inspect' ? deadline : null,
    checklist: items.map((label, i) => ({ label, checked: checked.has(i) })),
    toggleCheck: (i: number) =>
      setChecked((current) => {
        const next = new Set(current)
        if (next.has(i)) next.delete(i)
        else next.add(i)
        return next
      }),
    photos: listing.data?.photoUrls ?? [],
    code,
    setCode: (next: string) => {
      setCode(next)
      setCodeError(undefined)
    },
    codeError,
    canAccept: code.length === 6 && online && !giveCode.isPending,
    helpOpen,
    toggleHelp: () => setHelpOpen((v) => !v),
    phoneMasked: order?.buyer.phoneMasked ?? null,
    confirmOpen,
    setConfirmOpen,
    confirmBody: order
      ? order.listing.isSerialized
        ? `${formatKes(order.amount)} stays held for 24 hours while you test the item. After that it goes to ${order.seller.name}.`
        : `${formatKes(order.amount)} goes to ${order.seller.name}. Accepting is final.`
      : '',
    accept: () => void accept(),
    accepting: giveCode.isPending,
    holdDeadline: deadline?.kind === 'hold' ? deadline : null,
    acceptedProblems: order?.listing.policy.acceptedProblems ?? [],
    reportProblem: () => navigate(`/order/${orderId}/report`),
    trackOrder: () => navigate(`/order/${orderId}`),
  }
}
