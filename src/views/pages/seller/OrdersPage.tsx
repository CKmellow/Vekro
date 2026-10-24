import { Package, Search, SearchX } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { useOrdersPage, type OrderRow } from '@/controllers/useOrdersPage'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { MiniCountdown } from '../../components/domain/MiniCountdown'
import { StatusPill } from '../../components/domain/StatusPill'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { DataTable, type Column } from '../../components/ui/DataTable'
import { EmptyState } from '../../components/ui/EmptyState'
import { MoneyText } from '../../components/ui/MoneyText'
import { Pagination } from '../../components/ui/Pagination'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { TransitionDialog } from './orders/TransitionDialog'

function Thumb({ url }: { url: string | null }) {
  return url ? (
    <img src={url} alt="" className="size-10 shrink-0 rounded-sm border border-border object-cover" />
  ) : (
    <span className="grid size-10 shrink-0 place-items-center rounded-sm bg-sand-100 text-ink-400">
      <Package aria-hidden="true" className="size-5" />
    </span>
  )
}

/** S5 Orders list (design/S5-orders). Route /seller/orders. */
export function OrdersPage() {
  const p = useOrdersPage()
  const reduce = useReducedMotion()

  const columns: Column<OrderRow>[] = [
    {
      key: 'item',
      header: 'Item',
      hideOnCard: true,
      cell: (row) => (
        <Link
          to={`/seller/orders/${row.id}`}
          className="flex max-w-44 items-center gap-3 font-semibold hover:text-primary"
        >
          <Thumb url={row.photoUrl} />
          <span className="truncate" title={row.title}>
            {row.title}
          </span>
        </Link>
      ),
    },
    {
      key: 'placed',
      header: 'Order',
      sortable: true,
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
      key: 'buyer',
      header: 'Buyer',
      cell: (row) => (
        <span className="flex flex-col whitespace-nowrap">
          <span>{row.buyerName}</span>
          {row.buyerPhone && <span className="text-text-muted">{row.buyerPhone}</span>}
        </span>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'end',
      sortable: true,
      cell: (row) => <MoneyText amount={row.amount} />,
    },
    {
      key: 'status',
      header: 'Status',
      cell: (row) => (
        <span className="flex flex-col items-start gap-1.5">
          <StatusPill status={row.status} />
          {row.deadline && (
            <MiniCountdown
              deadline={row.deadline.at}
              totalMs={row.deadline.totalMs}
              serverOffsetMs={p.serverOffsetMs}
              label={row.deadline.label}
            />
          )}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-display-lg flex items-center gap-3 text-text">
        Orders
        {p.total !== undefined && (
          <span className="type-mono rounded-full bg-sand-100 px-3 py-1 text-ink-600">{p.total}</span>
        )}
      </h1>

      {p.state !== 'no_orders' && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 lg:flex-1">
            <SegmentedControl
              label="Filter orders"
              segments={p.segments}
              value={p.segment}
              onChange={p.setSegment}
            />
          </div>
          <label className="flex h-11 items-center gap-2 rounded-md border border-border bg-surface px-3 focus-within:border-emerald-500 lg:w-72">
            <Search aria-hidden="true" className="size-4 text-ink-400" />
            <span className="sr-only">Search orders</span>
            <input
              type="search"
              value={p.search}
              onChange={(e) => p.setSearch(e.target.value)}
              placeholder="Order ID or item"
              className="type-body-md min-w-0 flex-1 bg-transparent placeholder:text-ink-400 focus:outline-none"
            />
          </label>
        </div>
      )}

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      {p.state === 'loading' && (
        <SkeletonGroup label="Loading orders">
          <div className="flex flex-col gap-2 rounded-lg bg-surface p-4 shadow-1">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </SkeletonGroup>
      )}

      {p.state === 'error' && (
        <Banner
          tone="danger"
          title="We couldn't load your orders."
          action={
            <Button variant="secondary" className="h-10" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      )}

      {p.state === 'no_orders' && (
        <div className="rounded-lg bg-surface shadow-1">
          <EmptyState
            illustration="parcel"
            title="No orders yet"
            body="Share a Trust Link and your first order shows up here."
            action={
              <Link to="/seller/listings" className="type-title text-primary">
                Go to listings
              </Link>
            }
          />
        </div>
      )}

      {p.state === 'segment_empty' && (
        <div className="flex flex-col items-center gap-1 rounded-lg bg-surface px-5 py-12 text-center shadow-1">
          <p className="type-title text-text">{p.emptyText.title}</p>
          {p.emptyText.hint && <p className="type-body-sm text-text-muted">{p.emptyText.hint}</p>}
        </div>
      )}

      {p.state === 'no_results' && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-5 py-12 text-center shadow-1">
          <SearchX aria-hidden="true" className="size-8 text-ink-400" />
          <p className="type-title text-text">No orders match "{p.q}"</p>
          <Button variant="secondary" onClick={p.clearSearch}>
            Clear search
          </Button>
        </div>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {p.state === 'ready' && (
          <motion.div
            key={`${p.segment}:${p.page}`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : duration.tap }}
            className={cn('flex flex-col gap-4 transition-opacity', p.staleSince && 'opacity-70')}
          >
            <p className="sr-only" aria-live="polite">
              {p.range ? `${p.range.of} orders` : ''}
            </p>
            <DataTable
              caption="Orders"
              columns={columns}
              rows={p.rows}
              rowKey={(row) => row.id}
              sort={p.sort}
              onSortChange={p.setSort}
              cardTitle={(row) => (
                <Link to={`/seller/orders/${row.id}`} className="flex items-center gap-3">
                  <Thumb url={row.photoUrl} />
                  <span className="min-w-0 truncate">{row.title}</span>
                </Link>
              )}
              action={(row) =>
                row.quickAction ? (
                  <Button
                    variant="secondary"
                    className="type-body-sm h-10 px-4 font-semibold whitespace-nowrap"
                    disabled={!p.online}
                    title={p.online ? undefined : "You're offline"}
                    onClick={() => p.askQuick(row)}
                  >
                    {row.quickAction.label}
                    <span className="sr-only"> {row.reference}</span>
                  </Button>
                ) : null
              }
            />
            <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
              {p.range && (
                <p className="type-body-sm text-text-muted">
                  Showing {p.range.from} to {p.range.to} of {p.range.of}
                </p>
              )}
              <Pagination page={p.page} pageCount={p.pageCount} onPageChange={p.setPage} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <TransitionDialog
        pending={p.transition.pending}
        running={p.transition.running}
        onConfirm={() => void p.transition.confirm()}
        onCancel={p.transition.cancel}
      />
    </div>
  )
}
