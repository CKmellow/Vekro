import { useState } from 'react'
import { useSearchParams } from 'react-router'
import { formatKes } from '@/lib/money'
import { formatEat } from '@/lib/time'
import type { AnalyticsRange, Kpis } from '@/models/api/analytics'
import { issueLabel } from '@/models/domain/listing'
import { useSellerAnalytics } from '@/models/queries/analytics'
import { useOnline } from './useOnline'

export const UNLOCK_AT = 5

const RANGES: { value: AnalyticsRange; label: string }[] = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
]

export type OutcomeKey = 'released' | 'refunded' | 'disputed'
export const OUTCOMES: { key: OutcomeKey; label: string }[] = [
  { key: 'released', label: 'Released' },
  { key: 'refunded', label: 'Refunded' },
  { key: 'disputed', label: 'Disputed' },
]

export interface AnalyticsTile {
  key: string
  title: string
  value: string
  /** Against the previous period; `good` decides the colour (a falling dispute rate is good). */
  delta?: { text: string; good: boolean; up: boolean }
}

const pct = (v: number | null) => (v == null ? '–' : `${Math.round(v * 100)}%`)
const shortDate = new Intl.DateTimeFormat('en-KE', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const longDate = new Intl.DateTimeFormat('en-KE', {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})

/** A category key the app has no label for reads as words: "missing_parts" -> "Missing parts". */
const humanize = (text: string) => {
  const words = text.replace(/_/g, ' ')
  return words.charAt(0).toUpperCase() + words.slice(1)
}

/** "KES 40k" for chart axes. */
export function shortKes(amount: number): string {
  if (amount >= 1_000_000) return `KES ${Math.round(amount / 100_000) / 10}M`
  if (amount >= 1_000) return `KES ${Math.round(amount / 1_000)}k`
  return `KES ${amount}`
}

export function duration(seconds: number | null): string {
  if (seconds == null) return '–'
  const h = Math.floor(seconds / 3600)
  const m = Math.round((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function change(current: number, previous: number, lowerIsBetter = false) {
  if (current === previous) return undefined
  const up = current > previous
  return { up, good: lowerIsBetter ? !up : up }
}

export function toTiles(c: Kpis, p: Kpis): AnalyticsTile[] {
  const volumeChange = change(c.salesVolume, p.salesVolume)
  const ordersChange = change(c.orders, p.orders)
  const disputeChange =
    c.disputeRate != null && p.disputeRate != null ? change(c.disputeRate, p.disputeRate, true) : undefined
  return [
    {
      key: 'volume',
      title: 'Sales volume',
      value: formatKes(c.salesVolume),
      delta:
        volumeChange && p.salesVolume > 0
          ? {
              ...volumeChange,
              text: `${volumeChange.up ? '+' : ''}${Math.round(((c.salesVolume - p.salesVolume) / p.salesVolume) * 100)}%`,
            }
          : undefined,
    },
    {
      key: 'orders',
      title: 'Orders',
      value: String(c.orders),
      delta: ordersChange && { ...ordersChange, text: `${ordersChange.up ? '+' : ''}${c.orders - p.orders}` },
    },
    {
      key: 'aov',
      title: 'Average order value',
      value: c.averageOrderValue == null ? '–' : formatKes(c.averageOrderValue),
    },
    { key: 'completion', title: 'Completion rate', value: pct(c.completionRate) },
    {
      key: 'disputes',
      title: 'Dispute rate',
      value: pct(c.disputeRate),
      delta: disputeChange && {
        ...disputeChange,
        text: `${disputeChange.up ? '+' : ''}${Math.round(((c.disputeRate ?? 0) - (p.disputeRate ?? 0)) * 100)} pts`,
      },
    },
    { key: 'dispatch', title: 'Average time to dispatch', value: duration(c.averageDispatchSeconds) },
  ]
}

/** S12 Analytics (design/S12-analytics). Route /seller/analytics?range=. */
export function useAnalytics() {
  const online = useOnline()
  const [params, setParams] = useSearchParams()
  const raw = params.get('range')
  const range: AnalyticsRange = raw === '7d' || raw === '90d' ? raw : '30d'
  const query = useSellerAnalytics(range)
  const data = query.data
  const [hidden, setHidden] = useState<Set<OutcomeKey>>(new Set())
  const [asTable, setAsTable] = useState(false)
  const [sort, setSort] = useState<{ key: 'orders' | 'sales'; direction: 'asc' | 'desc' }>({
    key: 'orders',
    direction: 'desc',
  })

  const c = data?.current
  const p = data?.previous
  const sales =
    data?.sales.map((s) => ({
      ...s,
      label: shortDate.format(new Date(s.date)),
      long: `${data.bucket === 'week' ? 'Week of ' : ''}${longDate.format(new Date(s.date))}`,
    })) ?? []

  const summary =
    c && p
      ? `${formatKes(c.salesVolume)} released over ${data.rangeDays} days${
          p.salesVolume > 0
            ? `, ${c.salesVolume >= p.salesVolume ? 'up' : 'down'} from ${formatKes(p.salesVolume)} the period before`
            : ''
        }.`
      : ''

  const top = [...(data?.topListings ?? [])].sort((a, b) => {
    const d = a[sort.key] - b[sort.key]
    return sort.direction === 'asc' ? d : -d
  })

  return {
    ranges: RANGES,
    range,
    setRange: (value: AnalyticsRange) =>
      setParams(
        (cur) => {
          const next = new URLSearchParams(cur)
          if (value === '30d') next.delete('range')
          else next.set('range', value)
          return next
        },
        { replace: true },
      ),
    state: data
      ? data.completedSales < UNLOCK_AT
        ? ('locked' as const)
        : ('ready' as const)
      : query.isError
        ? ('error' as const)
        : ('loading' as const),
    completedSales: data?.completedSales ?? 0,
    retry: () => void query.refetch(),
    refreshing: query.isFetching && Boolean(data),
    staleSince: !online && data ? formatEat(new Date(query.dataUpdatedAt).toISOString()) : null,
    tiles: c && p ? toTiles(c, p) : [],
    sales,
    salesSummary: summary,
    bucket: data?.bucket ?? 'day',
    outcomes: (data?.outcomes ?? []).map((o) => ({ ...o, label: shortDate.format(new Date(o.weekStart)) })),
    outcomeSeries: OUTCOMES.map((o) => ({ ...o, hidden: hidden.has(o.key) })),
    toggleOutcome: (key: OutcomeKey) =>
      setHidden((h) => {
        const next = new Set(h)
        if (next.has(key)) next.delete(key)
        else next.add(key)
        return next
      }),
    categories: (data?.disputeCategories ?? []).map((d) => ({
      label: humanize(issueLabel(d.category) ?? d.category),
      count: d.count,
    })),
    topListings: top.map((t) => ({
      ...t,
      salesText: formatKes(t.sales),
      completionText: pct(t.completionRate),
    })),
    sort,
    setSort,
    asTable,
    toggleTable: () => setAsTable((v) => !v),
    formatKes,
    shortKes,
  }
}
