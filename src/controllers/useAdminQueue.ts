import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { formatEat, formatEatFull } from '@/lib/time'
import {
  caseAge,
  decisionTime,
  TRIGGER_LABEL,
  type AdminCaseSummary,
  type CaseStatusFilter,
  type CaseTrigger,
} from '@/models/domain/adminCase'
import { issueLabel } from '@/models/domain/listing'
import { useCases } from '@/models/queries/admin'
import { useOnline } from './useOnline'

export const STATUS_FILTERS: { value: CaseStatusFilter; label: string }[] = [
  { value: 'open', label: 'Open' },
  { value: 'decided', label: 'Decided' },
  { value: 'all', label: 'All' },
]

export interface QueueRow {
  disputeId: string
  caseId: string
  reference: string
  itemTitle: string
  amount: number
  trigger: string | null
  triggerKey: CaseTrigger | null
  category: string | null
  age: ReturnType<typeof caseAge>
  escalatedFull: string | null
  buyerName: string
  sellerName: string
  decision: string | null
}

const DECISION: Record<string, string> = { refund: 'Refunded', release: 'Released', split: 'Split' }

/** A short, readable case id: "D-7K3P" from the dispute uuid. */
export const shortCaseId = (disputeId: string) => `D-${disputeId.replace(/-/g, '').slice(0, 4).toUpperCase()}`

export function toQueueRow(c: AdminCaseSummary, now = Date.now()): QueueRow {
  const trigger = c.trigger
    ? c.trigger === 'party_escalated' && c.escalatedBy
      ? `${c.escalatedBy === 'seller' ? 'Seller' : 'Buyer'} disagrees`
      : TRIGGER_LABEL[c.trigger]
    : null
  return {
    disputeId: c.disputeId,
    caseId: shortCaseId(c.disputeId),
    reference: c.reference,
    itemTitle: c.itemTitle,
    amount: c.amount,
    trigger,
    triggerKey: c.trigger,
    category: issueLabel(c.category),
    age: caseAge(c.escalatedAt, now),
    escalatedFull: c.escalatedAt ? formatEatFull(c.escalatedAt) : null,
    buyerName: c.buyerName,
    sellerName: c.sellerName,
    decision: c.decision ? (DECISION[c.decision] ?? c.decision) : null,
  }
}

const isStatus = (v: string | null): v is CaseStatusFilter => v === 'open' || v === 'decided' || v === 'all'

/** A2 Escalation queue (design/A2-queue). Route /admin. */
export function useAdminQueue() {
  const navigate = useNavigate()
  const online = useOnline()
  const [params, setParams] = useSearchParams()
  const status = isStatus(params.get('status')) ? (params.get('status') as CaseStatusFilter) : 'open'
  const page = Math.max(1, Number(params.get('page')) || 1)
  const [triggers, setTriggers] = useState<Set<CaseTrigger>>(new Set())
  const [sort, setSort] = useState<{ key: string; direction: 'asc' | 'desc' }>({
    key: 'age',
    direction: 'desc',
  })
  const query = useCases(status, page)
  const list = query.data

  const rows = (list?.items ?? [])
    .map((c) => toQueueRow(c))
    .filter((r) => triggers.size === 0 || (r.triggerKey !== null && triggers.has(r.triggerKey)))
    .sort((a, b) => {
      const sign = sort.direction === 'asc' ? 1 : -1
      return sort.key === 'amount' ? sign * (a.amount - b.amount) : sign * (a.age.hours - b.age.hours)
    })

  return {
    status,
    setStatus: (value: CaseStatusFilter) => setParams({ status: value }, { replace: true }),
    statuses: STATUS_FILTERS,
    triggers,
    toggleTrigger: (t: CaseTrigger) =>
      setTriggers((current) => {
        const next = new Set(current)
        if (next.has(t)) next.delete(t)
        else next.add(t)
        return next
      }),
    triggerOptions: (Object.keys(TRIGGER_LABEL) as CaseTrigger[]).map((value) => ({
      value,
      label: TRIGGER_LABEL[value],
    })),
    sort,
    setSort,
    rows,
    counters: list
      ? [
          { label: 'Open cases', value: String(list.counters.open), alert: false },
          {
            label: 'Older than 24h',
            value: String(list.counters.olderThan24h),
            alert: list.counters.olderThan24h > 0,
          },
          { label: 'Decided today', value: String(list.counters.decidedToday), alert: false },
          {
            label: 'Average time to decide',
            value: decisionTime(list.counters.averageDecisionSeconds) ?? '—',
            alert: false,
          },
        ]
      : null,
    page,
    pageCount: list ? Math.max(1, Math.ceil(list.total / list.pageSize)) : 1,
    setPage: (next: number) => setParams({ status, page: String(next) }, { replace: true }),
    state: list
      ? rows.length === 0
        ? ('empty' as const)
        : ('ready' as const)
      : query.isPending
        ? ('loading' as const)
        : ('error' as const),
    filtered: triggers.size > 0,
    retry: () => void query.refetch(),
    staleSince: !online && list ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    open: (disputeId: string) => navigate(`/admin/cases/${disputeId}`),
  }
}
