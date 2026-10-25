import { photoUrl } from './adapters/listings'
import { api, type Schemas } from './client'

export type AnalyticsRange = '7d' | '30d' | '90d'

export interface Kpis {
  salesVolume: number
  orders: number
  averageOrderValue: number | null
  completionRate: number | null
  disputeRate: number | null
  averageDispatchSeconds: number | null
}

export interface SellerAnalytics {
  rangeDays: number
  completedSales: number
  current: Kpis
  previous: Kpis
  bucket: 'day' | 'week'
  sales: { date: string; amount: number; orders: number }[]
  outcomes: { weekStart: string; released: number; refunded: number; disputed: number }[]
  disputeCategories: { category: string; count: number }[]
  topListings: {
    id: string
    title: string
    photoUrl: string | null
    orders: number
    sales: number
    completionRate: number | null
  }[]
}

const kpis = (k: Schemas['AnalyticsKpis']): Kpis => ({
  salesVolume: Number(k.sales_volume),
  orders: k.orders,
  averageOrderValue: k.average_order_value == null ? null : Number(k.average_order_value),
  completionRate: k.completion_rate ?? null,
  disputeRate: k.dispute_rate ?? null,
  averageDispatchSeconds: k.average_dispatch_seconds ?? null,
})

/** GET /seller/analytics (backend #209): the seller's own paid orders, EAT dates. */
export async function getAnalytics(range: AnalyticsRange, signal?: AbortSignal): Promise<SellerAnalytics> {
  const r = await api.get('/seller/analytics', { query: { range }, signal })
  return {
    rangeDays: r.range_days,
    completedSales: r.completed_sales,
    current: kpis(r.current),
    previous: kpis(r.previous),
    bucket: r.bucket,
    sales: r.sales_series.map((p) => ({ date: p.date, amount: Number(p.amount), orders: p.orders })),
    outcomes: r.outcomes.map((o) => ({
      weekStart: o.week_start,
      released: o.released,
      refunded: o.refunded,
      disputed: o.disputed,
    })),
    disputeCategories: r.dispute_categories,
    topListings: r.top_listings.map((t) => ({
      id: t.listing_id,
      title: t.title,
      photoUrl: t.photo_url ? photoUrl(t.photo_url) : null,
      orders: t.orders,
      sales: Number(t.sales),
      completionRate: t.completion_rate ?? null,
    })),
  }
}
