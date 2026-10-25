import type {
  AdminCaseDetail,
  AdminCaseList,
  AdminCaseSummary,
  AdminSearchFilter,
  AdminTransactionRow,
  CaseStatusFilter,
} from '@/models/domain/adminCase'
import { api, type Schemas } from './client'

type SummaryResponse = Schemas['AdminCaseSummaryResponse']

const toSummary = (raw: SummaryResponse): AdminCaseSummary => ({
  disputeId: raw.dispute_id,
  transactionId: raw.transaction_id,
  reference: raw.reference,
  amount: Number(raw.amount),
  itemTitle: raw.item_title,
  buyerName: raw.buyer_name,
  sellerName: raw.seller_name,
  category: raw.category,
  trigger: raw.trigger ?? null,
  escalatedBy: raw.escalated_by === 'buyer' || raw.escalated_by === 'seller' ? raw.escalated_by : null,
  decision: raw.admin_decision ?? null,
  openedAt: raw.opened_at,
  escalatedAt: raw.escalated_at ?? null,
  resolvedAt: raw.resolved_at ?? null,
})

/** GET /admin/cases: the support queue with its counters. */
export async function listCases(
  filter: { status?: CaseStatusFilter; page?: number; pageSize?: number } = {},
  signal?: AbortSignal,
): Promise<AdminCaseList> {
  const raw = await api.get('/admin/cases', {
    query: { status: filter.status, page: filter.page, page_size: filter.pageSize },
    signal,
  })
  return {
    items: raw.items.map(toSummary),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
    counters: {
      open: raw.counters.open,
      olderThan24h: raw.counters.older_than_24h,
      decidedToday: raw.counters.decided_today,
      averageDecisionSeconds: raw.counters.average_decision_seconds ?? null,
    },
  }
}

/** GET /admin/cases/{id}: everything support needs to decide. */
export async function getCase(disputeId: string, signal?: AbortSignal): Promise<AdminCaseDetail> {
  const raw = await api.get('/admin/cases/{dispute_id}', { path: { dispute_id: disputeId }, signal })
  const party = (p: Schemas['AdminCaseParty']) => ({
    name: p.name,
    phone: p.phone,
    orders: p.orders,
    completedSales: p.completed_sales,
    disputeRate: p.dispute_rate,
  })
  return {
    ...toSummary(raw),
    transactionStatus: raw.transaction_status,
    description: raw.description,
    uniqueId: raw.unique_id ?? null,
    isSerialized: raw.is_serialized,
    policy: raw.dispute_policy,
    buyer: party(raw.buyer),
    seller: party(raw.seller),
    sellerAction: raw.seller_action ?? null,
    sellerNotes: raw.seller_notes ?? null,
    buyerNotes: raw.buyer_notes ?? null,
    reconfirmRejections: raw.reconfirm_rejections,
    escalationReason: raw.escalation_reason ?? null,
    decided: raw.decision
      ? {
          decision: raw.decision.decision,
          reason: raw.decision.reason ?? null,
          sellerShare: raw.decision.seller_share == null ? null : Number(raw.decision.seller_share),
          decidedBy: raw.decision.decided_by ?? null,
          decidedAt: raw.decision.decided_at ?? null,
        }
      : null,
    timeline: raw.timeline,
  }
}

/** POST force-resolve: a binding decision. `sellerShare` (0.01 to 0.99) only for a split. */
export async function decideCase(
  disputeId: string,
  decision: 'refund' | 'release' | 'split',
  reason: string,
  sellerShare?: number,
): Promise<void> {
  await api.post('/admin/disputes/{dispute_id}/force-resolve', {
    path: { dispute_id: disputeId },
    body: {
      decision,
      reason,
      ...(decision === 'split' && sellerShare !== undefined ? { seller_share: sellerShare.toFixed(4) } : {}),
    },
  })
}

export const SEARCH_PAGE = 25

/** GET /admin/transactions: read-only search; without a query it is recent activity. */
export async function searchTransactions(
  filter: AdminSearchFilter = {},
  signal?: AbortSignal,
): Promise<{ items: AdminTransactionRow[]; total: number; page: number; pageSize: number }> {
  const raw = await api.get('/admin/transactions', {
    query: {
      q: filter.q?.trim() || undefined,
      status: filter.statuses?.length ? filter.statuses : undefined,
      placed_from: filter.placedFrom || undefined,
      placed_to: filter.placedTo || undefined,
      min_amount: filter.minAmount,
      max_amount: filter.maxAmount,
      serialized: filter.serialized,
      page: filter.page,
      page_size: SEARCH_PAGE,
    },
    signal,
  })
  return {
    items: raw.items.map((r) => ({
      transactionId: r.transaction_id,
      reference: r.reference,
      status: r.status,
      amount: Number(r.amount),
      itemTitle: r.item_title,
      isSerialized: r.is_serialized,
      buyer: r.buyer,
      seller: r.seller,
      createdAt: r.created_at,
      lastEvent: r.last_event ?? null,
      disputeId: r.dispute_id ?? null,
    })),
    total: raw.total,
    page: raw.page,
    pageSize: raw.page_size,
  }
}
