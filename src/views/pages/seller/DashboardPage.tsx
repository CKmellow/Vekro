import { ArrowDown, ArrowUp, CircleCheck, Circle, Lightbulb, Lock, Package, Plus } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { useSellerDashboard, type DashboardAction, type KpiTile } from '@/controllers/useSellerDashboard'
import type { OrderRow } from '@/controllers/useOrdersPage'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { StatusPill } from '../../components/domain/StatusPill'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { MoneyText } from '../../components/ui/MoneyText'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { TransitionDialog } from './orders/TransitionDialog'

function Thumb({ url, size = 'size-12' }: { url: string | null; size?: string }) {
  return url ? (
    <img src={url} alt="" className={cn(size, 'shrink-0 rounded-sm border border-border object-cover')} />
  ) : (
    <span className={cn(size, 'grid shrink-0 place-items-center rounded-sm bg-sand-100 text-ink-400')}>
      <Package aria-hidden="true" className="size-5" />
    </span>
  )
}

function Kpi({ tile }: { tile: KpiTile }) {
  return (
    <Link
      to={tile.to}
      className="relative flex min-w-60 snap-start flex-col gap-2 rounded-lg bg-surface p-5 shadow-1 transition-shadow hover:shadow-2 lg:min-w-0"
    >
      <span className="type-label flex items-center gap-2 text-text-muted">
        {tile.title}
        {tile.alert && <span aria-hidden="true" className="size-2 rounded-full bg-coral-500" />}
      </span>
      <span className="flex items-baseline gap-2">
        <span className="type-headline text-text tabular-nums">
          {'money' in tile.value ? <MoneyText amount={tile.value.money} countUp /> : tile.value.count}
        </span>
        {tile.delta && (
          <span
            className={cn(
              'type-body-sm inline-flex items-center gap-0.5 rounded-full px-2 font-semibold',
              tile.delta.up ? 'bg-emerald-50 text-emerald-700' : 'bg-coral-50 text-coral-600',
            )}
          >
            {tile.delta.up ? (
              <ArrowUp aria-hidden="true" className="size-3.5" />
            ) : (
              <ArrowDown aria-hidden="true" className="size-3.5" />
            )}
            {tile.delta.text}
            <span className="sr-only"> against last month</span>
          </span>
        )}
      </span>
      <span className="type-body-sm text-text-muted">{tile.caption}</span>
    </Link>
  )
}

function ActionCard({
  action,
  offsetMs,
  disabled,
  onRun,
  index,
}: {
  action: DashboardAction
  offsetMs: number
  disabled: boolean
  onRun: () => void
  index: number
}) {
  const reduce = useReducedMotion()
  return (
    <m.li
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : duration.state, delay: reduce ? 0 : index * 0.04 }}
      className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-1"
    >
      <div className="flex items-start gap-3">
        <Thumb url={action.photoUrl} />
        <div className="min-w-0 flex-1">
          <Link
            to={`/seller/orders/${action.id}`}
            className="type-body-md flex min-h-11 items-center font-semibold text-text hover:text-primary"
          >
            <span className="truncate">{action.title}</span>
          </Link>
          <p className="type-mono text-text-muted">{action.reference}</p>
        </div>
        {action.deadline && (
          <CountdownRing
            deadline={action.deadline.at}
            totalMs={action.deadline.totalMs}
            serverOffsetMs={offsetMs}
            label={action.deadline.label}
          />
        )}
      </div>
      <p className="type-body-sm text-ink-600">{action.instruction}</p>
      <Button
        variant="secondary"
        className="type-body-sm mt-auto h-11 font-semibold"
        disabled={disabled && action.button.kind !== 'open_case'}
        onClick={onRun}
      >
        {action.button.label}
        <span className="sr-only"> {action.reference}</span>
      </Button>
    </m.li>
  )
}

/** S4 Dashboard (design/S4-dashboard). Route /seller. */
export function DashboardPage() {
  const p = useSellerDashboard()

  const columns: Column<OrderRow>[] = [
    {
      key: 'item',
      header: 'Item',
      hideOnCard: true,
      cell: (row) => (
        <Link
          to={`/seller/orders/${row.id}`}
          className="flex max-w-36 items-center gap-3 font-semibold hover:text-primary"
        >
          <Thumb url={row.photoUrl} size="size-10" />
          <span className="truncate" title={row.title}>
            {row.title}
          </span>
        </Link>
      ),
    },
    {
      key: 'order',
      header: 'Order',
      cell: (row) => (
        <span className="flex flex-col whitespace-nowrap">
          <span className="type-mono text-text">{row.reference}</span>
          <span className="text-text-muted" title={row.placedFull}>
            {row.placed}
          </span>
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      cell: (row) => (
        <span className="whitespace-nowrap">
          <MoneyText amount={row.amount} />
        </span>
      ),
    },
    { key: 'status', header: 'Status', cell: (row) => <StatusPill status={row.status} /> },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="type-display-lg text-text">{p.greeting}</h1>
          <p className="type-body-md text-text-muted">{p.today}</p>
        </div>
        <Link
          to="/seller/listings/new"
          className="type-body-md hidden h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-on-primary shadow-highlight hover:bg-primary-hover lg:inline-flex"
        >
          <Plus aria-hidden="true" className="size-5" />
          New listing
        </Link>
      </div>

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      {p.state === 'loading' && (
        <SkeletonGroup label="Loading your dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-28 w-full rounded-lg" />
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-44 w-full rounded-lg" />
            ))}
          </div>
        </SkeletonGroup>
      )}

      {p.state === 'error' && (
        <Banner
          tone="danger"
          title="We couldn't load your dashboard."
          action={
            <Button variant="secondary" className="h-10" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      )}

      {p.state === 'new_seller' && (
        <Card className="flex flex-col gap-4 bg-emerald-50">
          <div>
            <h2 className="type-headline text-text">Get ready to sell</h2>
            <p className="type-body-sm text-text-muted">
              {p.checklist.filter((c) => c.done).length} of {p.checklist.length} done
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Setup progress"
            aria-valuemin={0}
            aria-valuemax={p.checklist.length}
            aria-valuenow={p.checklist.filter((c) => c.done).length}
            className="h-2 overflow-hidden rounded-full bg-emerald-100"
          >
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width]"
              style={{ width: `${(p.checklist.filter((c) => c.done).length / p.checklist.length) * 100}%` }}
            />
          </div>
          <ul className="flex flex-col gap-2">
            {p.checklist.map((step) => (
              <li key={step.label}>
                <Link
                  to={step.to}
                  className="type-body-md flex min-h-12 items-center gap-3 rounded-md bg-surface px-4 hover:shadow-1"
                >
                  {step.done ? (
                    <CircleCheck aria-hidden="true" className="size-5 text-emerald-600" />
                  ) : (
                    <Circle aria-hidden="true" className="size-5 text-ink-400" />
                  )}
                  <span className={cn(step.done && 'text-text-muted line-through')}>{step.label}</span>
                  <span className="sr-only">{step.done ? ', done' : ', to do'}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {p.state === 'ready' && (
        <>
          <section aria-label="Key numbers" className="min-w-0">
            <div className="-mx-5 flex snap-x gap-4 overflow-x-auto px-5 pb-1 lg:mx-0 lg:grid lg:grid-cols-4 lg:overflow-visible lg:px-0">
              {p.kpis.map((tile) => (
                <Kpi key={tile.key} tile={tile} />
              ))}
            </div>
          </section>

          <section aria-labelledby="needs-action" className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 id="needs-action" className="type-headline flex items-center gap-2 text-text">
                Needs your action
                {p.actions.length > 0 && (
                  <span className="type-mono rounded-full bg-saffron-50 px-2.5 text-saffron-700">
                    {p.actions.length + p.moreActions}
                  </span>
                )}
              </h2>
              {p.moreActions > 0 && (
                <Link
                  to="/seller/orders?segment=needs_action"
                  className="type-body-md font-semibold text-primary"
                >
                  See all {p.actions.length + p.moreActions}
                </Link>
              )}
            </div>
            {p.actions.length > 0 ? (
              <ul className="grid gap-4 lg:grid-cols-3">
                {p.actions.map((action, i) => (
                  <ActionCard
                    key={action.id}
                    action={action}
                    index={i}
                    offsetMs={p.serverOffsetMs}
                    disabled={!p.online}
                    onRun={() => p.runAction(action)}
                  />
                ))}
              </ul>
            ) : (
              <div className="rounded-lg bg-surface shadow-1">
                <EmptyState
                  illustration="vault"
                  title="You're all caught up"
                  body="New orders that need you will show here."
                />
              </div>
            )}
          </section>

          <div className="grid items-start gap-6 lg:grid-cols-12">
            <section aria-labelledby="recent" className="flex flex-col gap-3 lg:col-span-8">
              <div className="flex items-center justify-between">
                <h2 id="recent" className="type-title text-text">
                  Recent orders
                </h2>
                <Link
                  to="/seller/orders"
                  className="type-body-md inline-flex min-h-11 items-center font-semibold text-primary"
                >
                  View all orders
                </Link>
              </div>
              <DataTable
                caption="Recent orders"
                columns={columns}
                rows={p.recent}
                rowKey={(row) => row.id}
                cardTitle={(row) => (
                  <Link to={`/seller/orders/${row.id}`} className="flex items-center gap-3">
                    <Thumb url={row.photoUrl} size="size-10" />
                    <span className="min-w-0 truncate">{row.title}</span>
                  </Link>
                )}
              />
            </section>

            <aside aria-label="Shortcuts" className="flex flex-col gap-4 lg:col-span-4">
              {p.payouts && (
                <Card className="flex flex-col gap-3">
                  <h2 className="type-title text-text">Payouts</h2>
                  <div>
                    <p className="type-label text-text-muted">Paid out this month</p>
                    <p className="type-headline text-text">
                      <MoneyText amount={p.payouts.paidThisMonth} />
                    </p>
                  </div>
                  <div>
                    <p className="type-label text-text-muted">Next payout</p>
                    {p.payouts.next ? (
                      <Link
                        to={`/seller/orders/${p.payouts.next.id}`}
                        className="type-body-md font-semibold text-primary"
                      >
                        <span className="type-mono">{p.payouts.next.reference}</span>, when its 24-hour hold
                        ends
                      </Link>
                    ) : (
                      <p className="type-body-md text-text-muted">After your next buyer accepts their item</p>
                    )}
                  </div>
                  <p className="type-body-sm flex gap-2 text-text-muted">
                    <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-700" />
                    Money moves to your M-Pesa only after the buyer accepts the item.
                  </p>
                </Card>
              )}
              {p.showTip && (
                <Card className="flex gap-3 bg-sand-100 shadow-none">
                  <Lightbulb aria-hidden="true" className="size-5 shrink-0 text-saffron-700" />
                  <p className="type-body-sm text-ink-600">
                    <span className="font-semibold text-text">Tip: </span>
                    Add a second photo to your listings. Buyers trust what they can see.
                  </p>
                </Card>
              )}
            </aside>
          </div>
        </>
      )}

      <TransitionDialog
        pending={p.transition.pending}
        running={p.transition.running}
        onConfirm={() => void p.transition.confirm()}
        onCancel={p.transition.cancel}
      />
    </div>
  )
}
