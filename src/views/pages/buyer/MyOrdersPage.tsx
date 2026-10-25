import { LogOut, Package, Search } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link, Navigate } from 'react-router'
import { useMyOrders, type BuyerOrderCard } from '@/controllers/useMyOrders'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { MiniCountdown } from '../../components/domain/MiniCountdown'
import { StatusPill } from '../../components/domain/StatusPill'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextField } from '../../components/ui/Field'
import { MoneyText } from '../../components/ui/MoneyText'
import { Pagination } from '../../components/ui/Pagination'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Sheet } from '../../components/ui/Sheet'

function Dots({ progress }: { progress: NonNullable<BuyerOrderCard['progress']> }) {
  const label = progress.steps[Math.min(progress.current, progress.steps.length - 1)]
  return (
    <span
      role="img"
      aria-label={`Step ${Math.min(progress.current + 1, progress.steps.length)} of ${progress.steps.length}: ${label}`}
      className="flex items-center gap-1"
    >
      {progress.steps.map((step, i) => (
        <span
          key={step}
          className={cn(
            'h-1.5 rounded-full',
            i < progress.current
              ? 'w-4 bg-primary'
              : i === progress.current
                ? 'w-4 bg-emerald-500/50'
                : 'w-1.5 bg-sand-300',
          )}
        />
      ))}
    </span>
  )
}

function OrderCard({ card, serverOffsetMs }: { card: BuyerOrderCard; serverOffsetMs: number }) {
  return (
    <Link
      to={`/order/${card.id}`}
      className="flex gap-4 rounded-lg bg-surface p-4 shadow-1 transition-colors hover:bg-sand-50 focus-visible:outline-2 focus-visible:outline-emerald-500"
    >
      {card.photoUrl ? (
        <img
          src={card.photoUrl}
          alt=""
          className="size-16 shrink-0 rounded-md border border-border object-cover"
        />
      ) : (
        <span className="grid size-16 shrink-0 place-items-center rounded-md bg-sand-100 text-ink-400">
          <Package aria-hidden="true" className="size-6" />
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-1.5">
        <span className="flex items-start justify-between gap-3">
          <span className="type-title min-w-0 truncate text-text">{card.title}</span>
          <span className="type-title shrink-0 text-text">
            <MoneyText amount={card.amount} />
          </span>
        </span>
        <span className="type-body-sm text-text-muted">
          {card.sellerName} · <span className="font-mono">{card.reference}</span> ·{' '}
          <time title={card.placedFull}>{card.placed}</time>
        </span>
        <span className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <StatusPill status={card.status} />
          {card.progress && <Dots progress={card.progress} />}
          {card.deadline && (
            <MiniCountdown
              deadline={card.deadline.at}
              totalMs={card.deadline.totalMs}
              serverOffsetMs={serverOffsetMs}
              label={card.deadline.label}
            />
          )}
        </span>
      </span>
    </Link>
  )
}

/** B9 My orders (design/B9-my-orders). Route /buyer/orders. */
export function MyOrdersPage() {
  const p = useMyOrders()
  const reduce = useReducedMotion()
  if (p.redirect) return <Navigate to={p.redirect} replace />

  return (
    <div className="flex flex-col gap-5 pt-2">
      <title>My orders · Vekro</title>
      <div className="flex items-center justify-between gap-3">
        <h1 className="type-headline text-text">My orders</h1>
        <Button variant="ghost" onClick={p.signOut} loading={p.signingOut}>
          <LogOut aria-hidden="true" className="size-4" />
          Sign out
        </Button>
      </div>

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
      <SegmentedControl
        label="Filter orders"
        segments={p.segments}
        value={p.segment}
        onChange={p.setSegment}
      />

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
          title="No orders yet"
          body="When you buy with a Vekro link, it shows up here."
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
          No orders here yet.
        </p>
      )}

      {p.state === 'ready' && (
        <AnimatePresence mode="wait" initial={false}>
          <motion.ul
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
          </motion.ul>
        </AnimatePresence>
      )}
      {p.pageCount > 1 && <Pagination page={p.page} pageCount={p.pageCount} onPageChange={p.setPage} />}

      <button
        type="button"
        onClick={() => p.setTrackOpen(true)}
        className="type-title fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-20 inline-flex h-13 items-center gap-2 rounded-full bg-primary px-5 text-on-primary shadow-vault hover:bg-primary-hover"
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
