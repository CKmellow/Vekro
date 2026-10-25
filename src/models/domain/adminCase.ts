import type { TransactionStatus } from './stateMeta'

/** Escalated return cases as the support console sees them. */

export type CaseTrigger = 'receipt_timeout' | 'buyer_not_fixed_twice' | 'party_escalated' | 'other_category'
export type CaseStatusFilter = 'open' | 'decided' | 'all'
export type AdminDecision = 'refund' | 'release' | 'split'

export interface AdminCaseSummary {
  disputeId: string
  transactionId: string
  reference: string
  amount: number
  itemTitle: string
  buyerName: string
  sellerName: string
  category: string
  trigger: CaseTrigger | null
  escalatedBy: 'buyer' | 'seller' | null
  decision: AdminDecision | null
  openedAt: string
  escalatedAt: string | null
  resolvedAt: string | null
}

export interface AdminCaseCounters {
  open: number
  olderThan24h: number
  decidedToday: number
  averageDecisionSeconds: number | null
}

export interface AdminCaseList {
  items: AdminCaseSummary[]
  total: number
  page: number
  pageSize: number
  counters: AdminCaseCounters
}

export interface AdminCaseParty {
  name: string
  /** Full phone: admins only. */
  phone: string
  orders: number
  completedSales: number
  disputeRate: number
}

export interface AdminCaseDetail extends AdminCaseSummary {
  transactionStatus: string
  description: string
  uniqueId: string | null
  isSerialized: boolean
  policy: Record<string, unknown>
  buyer: AdminCaseParty
  seller: AdminCaseParty
  sellerAction: 'refund_issued' | 'repair_shipped' | 'replacement_shipped' | null
  sellerNotes: string | null
  buyerNotes: string | null
  reconfirmRejections: number
  escalationReason: string | null
  decided: {
    decision: AdminDecision
    reason: string | null
    sellerShare: number | null
    decidedBy: string | null
    decidedAt: string | null
  } | null
  timeline: { at: string; title: string; message: string; source: string }[]
}

export const TRIGGER_LABEL: Record<CaseTrigger, string> = {
  receipt_timeout: "Seller didn't confirm receipt",
  buyer_not_fixed_twice: 'Buyer said not fixed twice',
  party_escalated: 'Parties disagree',
  other_category: 'Something else category',
}

/** Age since escalation, for the queue badge: sand under 12h, saffron 12 to 24h, coral over 24h. */
export function caseAge(
  escalatedAt: string | null,
  now = Date.now(),
): { hours: number; tone: 'sand' | 'saffron' | 'coral'; label: string } {
  const hours = escalatedAt ? Math.max(0, (now - new Date(escalatedAt).getTime()) / 3_600_000) : 0
  const label =
    hours < 1
      ? `${Math.max(1, Math.round(hours * 60))}m`
      : hours < 48
        ? `${Math.floor(hours)}h`
        : `${Math.floor(hours / 24)}d`
  return { hours, tone: hours >= 24 ? 'coral' : hours >= 12 ? 'saffron' : 'sand', label }
}

/** "5h 20m" from seconds; null when there is nothing to average yet. */
export function decisionTime(seconds: number | null): string | null {
  if (seconds === null) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`
}

export interface AdminTransactionRow {
  transactionId: string
  reference: string
  status: TransactionStatus
  amount: number
  itemTitle: string
  isSerialized: boolean
  buyer: { name: string; phone: string }
  seller: { name: string; phone: string }
  createdAt: string
  lastEvent: { title: string; at: string } | null
  disputeId: string | null
}

export interface AdminSearchFilter {
  q?: string
  statuses?: TransactionStatus[]
  placedFrom?: string
  placedTo?: string
  minAmount?: number
  maxAmount?: number
  serialized?: boolean
  page?: number
}
