import type { OrderSummary } from '@/models/domain/order'
import type { BuyerFilter } from '@/models/domain/order'
import { api, type Schemas } from './client'
import { toOrderSummary } from './transactions'

export type NeedKind = Schemas['NeedsYouItem']['kind']

export interface NeedsYou {
  kind: NeedKind
  /** When the order times out, if it does (server clock). */
  dueAt: string | null
  order: OrderSummary
}

export interface BuyerHome {
  needsYou: NeedsYou[]
  recent: OrderSummary[]
  counts: Partial<Record<BuyerFilter, number>>
  /** Server clock minus device clock; countdowns add it. */
  serverOffsetMs: number
}

/** GET /buyer/home (backend #336, B10): what needs the buyer now, soonest first, and recent orders. */
export async function getBuyerHome(signal?: AbortSignal): Promise<BuyerHome> {
  const raw = await api.get('/buyer/home', { signal })
  const receivedAt = Date.now()
  return {
    needsYou: raw.needs_you.map((n) => ({
      kind: n.kind,
      dueAt: n.due_at ?? null,
      order: toOrderSummary(n.order),
    })),
    recent: raw.recent.map(toOrderSummary),
    counts: raw.counts as Partial<Record<BuyerFilter, number>>,
    serverOffsetMs: new Date(raw.server_time).getTime() - receivedAt,
  }
}
