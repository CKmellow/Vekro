import type { Schemas } from '@/models/api/client'

/** A `ListingResponse` with PAGES.md 0.1 sample data (Amina Gadgets' iPhone 13). */
export const listingResponse = (
  overrides: Partial<Schemas['ListingResponse']> = {},
): Schemas['ListingResponse'] => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  seller_id: '6a0e6b52-8a43-4c35-9c3f-2f0a3b1d7e11',
  title: 'iPhone 13, 128GB, Midnight',
  description: 'Battery health 91%. Comes with the original box and a cable.',
  category: 'Phones and tablets',
  buyer_name: null,
  price: '52000.00',
  is_serialized: true,
  unique_id: '352098114371234',
  dispute_policy: {
    accepted_problems: ["Won't power on", 'Screen or touch problem'],
    resolution: 'repair',
    allowed_seller_actions: ['repair_shipped', 'refund_issued'],
  },
  status: 'active',
  photos: [],
  seller: { name: 'Amina Gadgets', member_since: '2026-01-05T00:00:00Z', completed_sales: 12 },
  created_at: '2026-10-15T09:00:00Z',
  updated_at: '2026-10-15T09:00:00Z',
  ...overrides,
})

const SENT_AT = '2026-10-20T09:00:00Z'

/** A pending STK prompt sent at 09:00 UTC. */
export const paymentResponse = (
  overrides: Partial<Schemas['PaymentInstructionResponse']> = {},
): Schemas['PaymentInstructionResponse'] => ({
  kind: 'STK_PROMPT',
  redirect_url: null,
  status: 'pending',
  failure_reason: null,
  sent_at: SENT_AT,
  expires_at: '2026-10-20T09:01:30Z',
  resend_available_at: '2026-10-20T09:00:30Z',
  ...overrides,
})

/** The buyer's view of order VK-7K3P9Q for the iPhone 13, awaiting payment. */
export const orderResponse = (
  overrides: Partial<Schemas['TransactionDetailResponse']> = {},
): Schemas['TransactionDetailResponse'] => ({
  id: '9b2f4c1e-5d3a-4e8f-a1b2-c3d4e5f60718',
  reference: 'VK-7K3P9Q',
  listing_id: listingResponse().id,
  buyer_id: '1c9e6f0a-2b3d-4c5e-8f7a-9b0c1d2e3f40',
  seller_id: listingResponse().seller_id,
  amount: '52000.00',
  status: 'awaiting_payment',
  custody_provider: 'simulated',
  created_at: SENT_AT,
  updated_at: SENT_AT,
  viewer_role: 'buyer',
  listing: {
    id: listingResponse().id,
    title: 'iPhone 13, 128GB, Midnight',
    price: '52000.00',
    is_serialized: true,
    dispute_policy: listingResponse().dispute_policy,
  },
  buyer: { name: 'Wanjiku Kamau', phone_masked: '+254 712 *** 678' },
  seller: { name: 'Amina Gadgets', phone_masked: '+254 722 *** 904' },
  deadlines: {
    dispatch_by: null,
    inspect_by: null,
    hold_until: null,
    return_send_by: null,
    return_confirm_by: null,
  },
  server_time: SENT_AT,
  payment: paymentResponse(),
  ...overrides,
})

/** A seller's order-list row: VK-7K3P9Q paid and waiting to be dispatched by 26 Oct 09:10 UTC. */
export const orderSummaryResponse = (
  overrides: Partial<Schemas['TransactionSummaryResponse']> = {},
): Schemas['TransactionSummaryResponse'] => ({
  id: orderResponse().id,
  reference: 'VK-7K3P9Q',
  status: 'locked',
  amount: '52000.00',
  viewer_role: 'seller',
  listing: {
    id: listingResponse().id,
    title: 'iPhone 13, 128GB, Midnight',
    is_serialized: true,
    photo_url: null,
  },
  counterpart: { name: 'Brian Otieno', phone_masked: '+254 712 *** 678' },
  deadlines: { dispatch_by: '2026-10-26T09:10:00Z' },
  created_at: '2026-10-24T09:10:00Z',
  updated_at: '2026-10-24T09:10:00Z',
  ...overrides,
})

/** One page of the seller's orders, with counts; `server_time` defaults to 24 Oct 09:00 UTC. */
export const orderListResponse = (
  items: Schemas['TransactionSummaryResponse'][] = [orderSummaryResponse()],
  overrides: Partial<Schemas['TransactionListResponse']> = {},
): Schemas['TransactionListResponse'] => ({
  items,
  total: items.length,
  page: 1,
  page_size: 20,
  counts: { needs_action: 1, in_transit: 0, held: 0, completed: 0, issues: 0 },
  status_counts: { locked: 1 },
  server_time: '2026-10-24T09:00:00Z',
  ...overrides,
})

/** One page of the seller's listings with counts per status. */
export const listingListResponse = (
  items: Schemas['ListingResponse'][] = [listingResponse()],
  counts: Partial<Schemas['ListingListResponse']['counts']> = {},
): Schemas['ListingListResponse'] => ({
  items,
  total: items.length,
  page: 1,
  page_size: 100,
  counts: { active: items.length, awaiting_payment: 0, sold: 0, archived: 0, ...counts },
})

/** The seller's view of VK-7K3P9Q: paid, held in escrow, dispatch due 22 Oct 09:00 UTC. */
export const sellerOrderResponse = (
  overrides: Partial<Schemas['TransactionDetailResponse']> = {},
): Schemas['TransactionDetailResponse'] =>
  orderResponse({
    status: 'locked',
    viewer_role: 'seller',
    payment: null,
    deadlines: { ...orderResponse().deadlines, dispatch_by: '2026-10-22T09:00:00Z' },
    payout: { status: 'held', amount: null, reference: null, paid_at: null },
    ...overrides,
  })

/** Amina's dashboard totals. */
export const sellerSummaryResponse = (
  overrides: Partial<Schemas['SellerSummaryResponse']> = {},
): Schemas['SellerSummaryResponse'] => ({
  in_escrow: { amount: '143500.00', orders: 5 },
  released_this_month: { amount: '428000.00', orders: 31 },
  released_last_month: { amount: '382000.00', orders: 27 },
  awaiting_dispatch: 3,
  open_issues: 1,
  next_release: { id: orderResponse().id, reference: 'VK-7K3P9Q' },
  server_time: '2026-10-24T09:00:00Z',
  ...overrides,
})

/** A seller notification: payment received for VK-7K3P9Q at 09:00 UTC on 24 Oct, unread. */
export const notificationResponse = (
  overrides: Partial<Schemas['NotificationResponse']> = {},
): Schemas['NotificationResponse'] => ({
  id: 'n-1',
  user_id: listingResponse().seller_id,
  transaction_id: orderResponse().id,
  transaction_reference: 'VK-7K3P9Q',
  event_type: 'transaction_locked',
  channel: 'in_app',
  title: 'Buyer payment confirmed',
  message: 'KES 52,000 is held in escrow. Dispatch within 48 hours.',
  payload: {},
  is_read: false,
  read_at: null,
  delivered_at: null,
  delivery_status: 'not_attempted',
  created_at: '2026-10-24T09:00:00Z',
  ...overrides,
})

/** The dispute behind VK-7K3P9Q: "not working", reported 21 Oct 11:02 UTC. */
export const disputeResponse = (
  overrides: Partial<NonNullable<Schemas['TransactionDetailResponse']['dispute']>> = {},
): NonNullable<Schemas['TransactionDetailResponse']['dispute']> => ({
  id: 'd-1',
  status: 'open',
  category: 'not_working',
  description: 'The screen flickers and goes black after a few minutes.',
  opened_at: '2026-10-21T11:02:00Z',
  escalated_at: null,
  resolved_at: null,
  seller_action: null,
  seller_notes: null,
  buyer_notes: null,
  reconfirm_rejections: 0,
  buyer_confirmed_resolved: false,
  seller_confirmed_resolved: false,
  admin_decision: null,
  ...overrides,
})

/** An escalated case in the support queue (escalated two hours before `escalatedAt` is read). */
export const adminCaseSummaryResponse = (
  overrides: Partial<Schemas['AdminCaseSummaryResponse']> = {},
): Schemas['AdminCaseSummaryResponse'] => ({
  dispute_id: '7a3f9c2e-1b4d-4e8f-9a0b-1c2d3e4f5a6b',
  transaction_id: orderResponse().id,
  reference: 'VK-7K3P9Q',
  amount: '52000.00',
  item_title: 'iPhone 13, 128GB, Midnight',
  buyer_name: 'Brian Otieno',
  seller_name: 'Amina Gadgets',
  category: 'not_working',
  trigger: 'party_escalated',
  escalated_by: 'seller',
  dispute_status: 'escalated_admin_review',
  transaction_status: 'escalated_admin_review',
  admin_decision: null,
  opened_at: '2026-10-21T09:00:00Z',
  escalated_at: new Date(Date.now() - 2 * 3_600_000).toISOString(),
  resolved_at: null,
  ...overrides,
})

export const adminCaseListResponse = (
  items: Schemas['AdminCaseSummaryResponse'][] = [adminCaseSummaryResponse()],
  overrides: Partial<Schemas['AdminCaseListResponse']> = {},
): Schemas['AdminCaseListResponse'] => ({
  items,
  total: items.length,
  page: 1,
  page_size: 25,
  counters: { open: items.length, older_than_24h: 0, decided_today: 3, average_decision_seconds: 19_200 },
  ...overrides,
})

/** The full case for review: a seller escalated a repair dispute over VK-7K3P9Q. */
export const adminCaseDetailResponse = (
  overrides: Partial<Schemas['AdminCaseDetailResponse']> = {},
): Schemas['AdminCaseDetailResponse'] => ({
  ...adminCaseSummaryResponse(),
  description: 'The screen flickers and goes black after a few minutes.',
  unique_id: '352098114371234',
  is_serialized: true,
  dispute_policy: { resolution: 'repair', allowed_seller_actions: ['repair_shipped', 'refund_issued'] },
  buyer: { name: 'Brian Otieno', phone: '+254712345678', orders: 3, completed_sales: 0, dispute_rate: 0 },
  seller: {
    name: 'Amina Gadgets',
    phone: '+254722118904',
    orders: 40,
    completed_sales: 36,
    dispute_rate: 0.05,
  },
  seller_action: null,
  seller_notes: null,
  buyer_notes: null,
  reconfirm_rejections: 0,
  escalation_reason: "The corner crack wasn't there when I sent it.",
  decision: null,
  timeline: [
    {
      at: '2026-10-20T09:00:00Z',
      title: 'Buyer payment confirmed',
      message: 'Paid.',
      source: 'notification',
    },
    {
      at: '2026-10-21T09:00:00Z',
      title: 'Problem reported',
      message: 'The screen flickers.',
      source: 'dispute',
    },
  ],
  ...overrides,
})
