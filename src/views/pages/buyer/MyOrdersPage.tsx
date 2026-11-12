import { Package, Search } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { Navigate } from 'react-router'
import { useMyOrders, type BuyerListView } from '@/controllers/useMyOrders'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { BuyerOrderCardView as OrderCard } from '../../components/domain/BuyerOrderCard'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextField } from '../../components/ui/Field'
import { Pagination } from '../../components/ui/Pagination'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Sheet } from '../../components/ui/Sheet'

const COPY = {
  orders: {
    title: 'Orders',
    filter: 'Filter orders',
    empty: { title: 'No orders yet', body: 'When you buy with a Vekro link, it shows up here.' },
  },
  cases: {
    title: 'Returns & disputes',
    filter: 'Show cases',
    empty: {
      title: 'No returns or disputes yet',
      body: 'If something is wrong with an order, report it from the order page.',
    },
  },
}

/** B9 Orders (route /buyer/orders) and B11 Returns & disputes (/buyer/cases), in the buyer shell (X4). */
export function MyOrdersPage({ view = 'orders' }: { view?: BuyerListView }) {
  const p = useMyOrders(view)
  const reduce = useReducedMotion()
  const copy = COPY[view]
  if (p.redirect) return <Navigate to={p.redirect} replace />

  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-5">
      <title>{`${copy.title} · Vekro`}</title>
      <h1 className="type-headline text-text">{copy.title}</h1>

      <label className="flex h-12 items-center gap-2 rounded-md border border-border bg-surface px-3 focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
        <Search aria-hidden="true" className="size-4 text-ink-400" />
        <span className="sr-only">Search by order ID or item</span>
        <input
          type="search"
          value={p.search}
          onChange={(e) => p.setSearch(e.target.value)}
          placeholder="Search by order ID or item"
          className="type-body-md min-w-0 flex-1 bg-transparent text-text placeholder:text-ink-400 focus:outline-none"
        />
      </label>
      <SegmentedControl label={copy.filter} segments={p.segments} value={p.segment} onChange={p.setSegment} />

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      {p.state === 'loading' && (
        <div role="status" aria-label="Loading your orders" className="flex flex-col gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-lg bg-sand-100" />
          ))}
        </div>
      )}
      {p.state === 'error' && (
        <Banner
          tone="danger"
          title="We couldn't load your orders."
          action={
            <Button variant="secondary" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      )}
      {p.state === 'no_orders' && (
        <EmptyState
          illustration="parcel"
          title={copy.empty.title}
          body={copy.empty.body}
          action={
            <Button variant="secondary" onClick={() => p.setTrackOpen(true)}>
              Track an order
            </Button>
          }
        />
      )}
      {p.state === 'no_results' && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-10 text-center shadow-1">
          <p className="type-title text-text">No orders match "{p.q}"</p>
          <Button variant="secondary" onClick={p.clearSearch}>
            Clear search
          </Button>
        </div>
      )}
      {p.state === 'segment_empty' && (
        <p className="type-body-md rounded-lg bg-surface px-6 py-10 text-center text-text-muted shadow-1">
          {view === 'cases' ? 'No open returns or disputes.' : 'No orders here yet.'}
        </p>
      )}

      {p.state === 'ready' && (
        <AnimatePresence mode="wait" initial={false}>
          <m.ul
            key={`${p.segment}-${p.q}-${p.page}`}
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? undefined : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : duration.tap }}
            className={cn('flex flex-col gap-3', p.staleSince && 'opacity-60')}
          >
            {p.cards.map((card) => (
              <li key={card.id}>
                <OrderCard card={card} serverOffsetMs={p.serverOffsetMs} />
              </li>
            ))}
          </m.ul>
        </AnimatePresence>
      )}
      {p.pageCount > 1 && <Pagination page={p.page} pageCount={p.pageCount} onPageChange={p.setPage} />}

      <button
        type="button"
        onClick={() => p.setTrackOpen(true)}
        className="type-title fixed right-5 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] z-20 inline-flex lg:bottom-6 h-13 items-center gap-2 rounded-full bg-primary px-5 text-on-primary shadow-vault hover:bg-primary-hover"
      >
        <Package aria-hidden="true" className="size-5" />
        Track an order
      </button>

      <Sheet
        open={p.trackOpen}
        onOpenChange={p.setTrackOpen}
        title="Track an order"
        description="Paste the order link from your SMS, or its reference."
        footer={
          <Button fullWidth onClick={p.openTrack} loading={p.finding}>
            Open
          </Button>
        }
      >
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            p.openTrack()
          }}
        >
          <TextField
            label="Order link or reference"
            value={p.track}
            onChange={(e) => p.setTrack(e.target.value)}
            error={p.trackError ?? undefined}
            placeholder="VK-7K3P9Q"
            autoCapitalize="characters"
          />
        </form>
      </Sheet>
    </div>
  )
}

/** B11 Returns & disputes (design/B11-returns-disputes). Route /buyer/cases. */
export function BuyerCasesPage() {
  return <MyOrdersPage view="cases" />
}
