import { ArrowDown, ArrowUp, ArrowUpDown, BarChart3, Package, Table2 } from 'lucide-react'
import { Link } from 'react-router'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useAnalytics, type AnalyticsTile } from '@/controllers/useAnalytics'
import { cn } from '@/lib/cn'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

type P = ReturnType<typeof useAnalytics>

// Series colours from tokens (validated: emerald, lake and coral pass the CVD and contrast checks).
const COLOR = {
  released: 'var(--color-emerald-600)',
  refunded: 'var(--color-lake-600)',
  disputed: 'var(--color-coral-500)',
}
const AXIS = { fontSize: 12, fill: 'var(--color-ink-500)' }

function Tile({ tile }: { tile: AnalyticsTile }) {
  return (
    <div className="flex min-w-56 snap-start flex-col gap-2 rounded-lg bg-surface p-5 shadow-1 lg:min-w-0">
      <span className="type-label text-text-muted">{tile.title}</span>
      <span className="flex items-baseline gap-2">
        <span className="type-headline text-text tabular-nums">{tile.value}</span>
        {tile.delta && (
          <span
            className={cn(
              'type-body-sm inline-flex items-center gap-0.5 rounded-full px-2 font-semibold',
              tile.delta.good ? 'bg-emerald-50 text-emerald-700' : 'bg-coral-50 text-coral-600',
            )}
          >
            {tile.delta.up ? (
              <ArrowUp aria-hidden="true" className="size-3.5" />
            ) : (
              <ArrowDown aria-hidden="true" className="size-3.5" />
            )}
            {tile.delta.text}
            <span className="sr-only"> against the previous period</span>
          </span>
        )}
      </span>
    </div>
  )
}

function TipBox({ title, lines }: { title: string; lines: string[] }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 shadow-1">
      <p className="type-body-sm font-semibold text-text">{title}</p>
      {lines.map((l) => (
        <p key={l} className="type-body-sm text-text-muted">
          {l}
        </p>
      ))}
    </div>
  )
}

function SalesChart({ p }: { p: P }) {
  return (
    <div className="h-64" role="img" aria-label={p.salesSummary}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={p.sales} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-emerald-100)" stopOpacity={0.9} />
              <stop offset="100%" stopColor="var(--color-emerald-50)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--color-sand-200)" />
          <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} minTickGap={24} />
          <YAxis
            tick={AXIS}
            tickLine={false}
            axisLine={false}
            width={64}
            tickFormatter={p.shortKes}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: 'var(--color-ink-400)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              const point = payload?.[0]?.payload as P['sales'][number] | undefined
              return active && point ? (
                <TipBox
                  title={point.long}
                  lines={[
                    p.formatKes(point.amount),
                    `${point.orders} ${point.orders === 1 ? 'order' : 'orders'}`,
                  ]}
                />
              ) : null
            }}
          />
          <Area
            type="monotone"
            dataKey="amount"
            stroke="var(--color-emerald-600)"
            strokeWidth={2}
            fill="url(#sales-fill)"
            activeDot={{ r: 5, stroke: 'var(--color-surface)', strokeWidth: 2 }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}

function OutcomesChart({ p }: { p: P }) {
  const shown = p.outcomeSeries.filter((s) => !s.hidden)
  return (
    <div className="flex flex-col gap-3">
      <div role="group" aria-label="Series" className="flex flex-wrap gap-2">
        {p.outcomeSeries.map((s) => (
          <button
            key={s.key}
            type="button"
            aria-pressed={!s.hidden}
            onClick={() => p.toggleOutcome(s.key)}
            className={cn(
              'type-body-sm inline-flex min-h-9 items-center gap-2 rounded-full border px-3 font-semibold',
              s.hidden ? 'border-border text-text-muted' : 'border-ink-400 text-text',
            )}
          >
            <span
              aria-hidden="true"
              className="size-2.5 rounded-full"
              style={{
                background: s.hidden ? 'transparent' : COLOR[s.key],
                border: `2px solid ${COLOR[s.key]}`,
              }}
            />
            {s.label}
          </button>
        ))}
      </div>
      <div className="h-56" role="img" aria-label="Orders by outcome per week">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={p.outcomes} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid vertical={false} stroke="var(--color-sand-200)" />
            <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
            <Tooltip
              cursor={{ fill: 'var(--color-sand-100)' }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <TipBox
                    title={`Week of ${String(label)}`}
                    lines={payload.map((s) => `${String(s.name)}: ${String(s.value)}`)}
                  />
                ) : null
              }
            />
            {shown.map((s, i) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="outcome"
                fill={COLOR[s.key]}
                stroke="var(--color-surface)"
                strokeWidth={2}
                maxBarSize={36}
                radius={i === shown.length - 1 ? [4, 4, 0, 0] : 0}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function CategoriesChart({ p }: { p: P }) {
  if (p.categories.length === 0)
    return <p className="type-body-md py-8 text-center text-text-muted">No issues reported in this period.</p>
  return (
    <div
      style={{ height: Math.max(120, p.categories.length * 44) }}
      role="img"
      aria-label="Dispute categories"
    >
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={p.categories} layout="vertical" margin={{ top: 0, right: 32, bottom: 0, left: 0 }}>
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis type="category" dataKey="label" tick={AXIS} tickLine={false} axisLine={false} width={150} />
          <Tooltip
            cursor={{ fill: 'var(--color-sand-100)' }}
            content={({ active, payload }) => {
              const row = payload?.[0]?.payload as P['categories'][number] | undefined
              return active && row ? <TipBox title={row.label} lines={[`${row.count} reported`]} /> : null
            }}
          />
          <Bar
            dataKey="count"
            fill={COLOR.disputed}
            radius={[0, 4, 4, 0]}
            maxBarSize={20}
            isAnimationActive={false}
          >
            <LabelList dataKey="count" position="right" style={{ ...AXIS, fill: 'var(--color-ink-600)' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function SortHeader({ p, column, label }: { p: P; column: 'orders' | 'sales'; label: string }) {
  const active = p.sort.key === column
  const Icon = !active ? ArrowUpDown : p.sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (p.sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="px-3 py-2 text-right"
    >
      <button
        type="button"
        onClick={() =>
          p.setSort({ key: column, direction: active && p.sort.direction === 'desc' ? 'asc' : 'desc' })
        }
        className="inline-flex items-center gap-1 uppercase hover:text-text"
      >
        {label}
        <Icon aria-hidden="true" className="size-3.5" />
      </button>
    </th>
  )
}

/** S12 Analytics (design/S12-analytics). Route /seller/analytics. */
export function AnalyticsPage() {
  const p = useAnalytics()

  return (
    <div className="flex flex-col gap-6">
      <title>Analytics · Vekro</title>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="type-display-lg text-text">Analytics</h1>
        <SegmentedControl label="Period" segments={p.ranges} value={p.range} onChange={p.setRange} />
      </div>

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      {p.state === 'loading' && (
        <SkeletonGroup label="Loading your analytics">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-24 rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </SkeletonGroup>
      )}
      {p.state === 'error' && (
        <Banner
          tone="danger"
          title="We couldn't load your analytics."
          action={
            <Button variant="secondary" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      )}
      {p.state === 'locked' && (
        <EmptyState
          illustration="listing"
          title="Make 5 sales to unlock analytics"
          body={`You've made ${p.completedSales}. Your numbers show here once there's enough to be useful.`}
          action={
            <Link to="/seller/listings" className="type-title text-primary">
              Share a listing
            </Link>
          }
        />
      )}

      {p.state === 'ready' && (
        <div
          className={cn(
            'flex flex-col gap-6 transition-opacity',
            (p.staleSince || p.refreshing) && 'opacity-60',
          )}
        >
          <section
            aria-label="Key numbers"
            className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:px-0"
          >
            {p.tiles.map((t) => (
              <Tile key={t.key} tile={t} />
            ))}
          </section>

          <Card className="flex flex-col gap-4 p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="type-title text-text">Sales over time</h2>
                <p className="type-body-sm text-text-muted">{p.salesSummary}</p>
              </div>
              <Button variant="ghost" onClick={p.toggleTable} aria-pressed={p.asTable}>
                {p.asTable ? (
                  <BarChart3 aria-hidden="true" className="size-4" />
                ) : (
                  <Table2 aria-hidden="true" className="size-4" />
                )}
                {p.asTable ? 'View as chart' : 'View as table'}
              </Button>
            </div>
            {p.asTable ? (
              <div className="max-h-72 overflow-y-auto">
                <table className="type-body-sm w-full text-left">
                  <caption className="sr-only">Sales by {p.bucket}</caption>
                  <thead className="type-label text-text-muted">
                    <tr>
                      <th scope="col" className="py-2">
                        {p.bucket === 'week' ? 'Week of' : 'Day'}
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Released
                      </th>
                      <th scope="col" className="py-2 text-right">
                        Orders
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.sales.map((s) => (
                      <tr key={s.date} className="border-t border-border">
                        <td className="py-2">{s.long}</td>
                        <td className="py-2 text-right tabular-nums">{p.formatKes(s.amount)}</td>
                        <td className="py-2 text-right tabular-nums">{s.orders}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <SalesChart p={p} />
            )}
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="flex flex-col gap-4 p-5 sm:p-6">
              <h2 className="type-title text-text">Orders by outcome</h2>
              <OutcomesChart p={p} />
            </Card>
            <Card className="flex flex-col gap-4 p-5 sm:p-6">
              <h2 className="type-title text-text">Dispute categories</h2>
              <CategoriesChart p={p} />
            </Card>
          </div>

          <Card className="flex flex-col gap-3 p-5 sm:p-6">
            <h2 className="type-title text-text">Top listings</h2>
            {p.topListings.length === 0 ? (
              <p className="type-body-md text-text-muted">No orders in this period.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="type-body-sm w-full min-w-120 text-left">
                  <caption className="sr-only">Top listings</caption>
                  <thead className="type-label text-text-muted">
                    <tr>
                      <th scope="col" className="px-3 py-2">
                        Listing
                      </th>
                      <SortHeader p={p} column="orders" label="Orders" />
                      <SortHeader p={p} column="sales" label="Sales" />
                      <th scope="col" className="px-3 py-2 text-right">
                        Completion
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.topListings.map((t) => (
                      <tr key={t.id} className="border-t border-border">
                        <td className="px-3 py-2">
                          <Link
                            to={`/seller/listings/${t.id}`}
                            className="flex items-center gap-3 font-semibold text-text hover:text-primary"
                          >
                            {t.photoUrl ? (
                              <img
                                src={t.photoUrl}
                                alt=""
                                className="size-10 shrink-0 rounded-sm border border-border object-cover"
                              />
                            ) : (
                              <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-sand-100 text-ink-400">
                                <Package aria-hidden="true" className="size-5" />
                              </span>
                            )}
                            <span className="truncate">{t.title}</span>
                          </Link>
                        </td>
                        <td className="px-3 py-2 text-right tabular-nums">{t.orders}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{t.salesText}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{t.completionText}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  )
}
