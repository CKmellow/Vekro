import { ArrowRight, Store } from 'lucide-react'
import { Link } from 'react-router'
import { useBuyerHome, type NeedCard } from '@/controllers/useBuyerHome'
import { cn } from '@/lib/cn'
import { BuyerOrderCardView } from '../../components/domain/BuyerOrderCard'
import { MiniCountdown } from '../../components/domain/MiniCountdown'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { MoneyText } from '../../components/ui/MoneyText'

function Need({ need, serverOffsetMs }: { need: NeedCard; serverOffsetMs: number }) {
  return (
    <article
      className={cn(
        'flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-1',
        need.countdown && 'border-l-4 border-saffron-500',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <h3 className="type-title text-text">{need.title}</h3>
          <p className="type-body-sm truncate text-text-muted">
            {need.item} · <span className="font-mono">{need.reference}</span>
          </p>
        </div>
        <span className="type-title shrink-0 text-text">
          <MoneyText amount={need.amount} />
        </span>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        {need.countdown ? (
          <MiniCountdown
            deadline={need.countdown.at}
            totalMs={need.countdown.totalMs}
            serverOffsetMs={serverOffsetMs}
            label={need.countdown.label}
          />
        ) : (
          <span />
        )}
        <Link
          to={need.action.to}
          className="type-body-md inline-flex min-h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-on-primary hover:bg-primary-hover"
        >
          {need.action.label}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      </div>
    </article>
  )
}

/** B10 Home (design/B10-buyer-home). Route /buyer. */
export function BuyerHomePage() {
  const p = useBuyerHome()
  return (
    <div className="flex flex-col gap-6">
      <title>Home · Vekro</title>
      <h1 className="type-headline text-text">Hi, {p.firstName || 'there'}</h1>

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}
      {p.state === 'error' && (
        <Banner
          tone="danger"
          title="We couldn't load your home."
          action={
            <Button variant="secondary" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
        <section aria-labelledby="needs-you" className="flex flex-col gap-3">
          <h2 id="needs-you" className="type-title text-text">
            Needs you
          </h2>
          {p.state === 'loading' ? (
            <div role="status" aria-label="Loading what needs you" className="flex flex-col gap-3">
              {[0, 1].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-sand-100" />
              ))}
            </div>
          ) : p.needs.length === 0 ? (
            <div className="rounded-lg bg-surface shadow-1">
              <EmptyState
                illustration="done"
                title="You're all caught up"
                body="We'll tell you here and by SMS when an order needs you."
              />
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {p.needs.map((need) => (
                <li key={need.id}>
                  <Need need={need} serverOffsetMs={p.serverOffsetMs} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section aria-labelledby="recent" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent" className="type-title text-text">
              Recent orders
            </h2>
            {p.state === 'ready' && (
              <Link to="/buyer/orders" className="type-body-md font-semibold text-primary">
                See all orders
              </Link>
            )}
          </div>
          {p.state === 'loading' && (
            <div role="status" aria-label="Loading your orders" className="flex flex-col gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-sand-100" />
              ))}
            </div>
          )}
          {p.state === 'no_orders' && (
            <div className="rounded-lg bg-surface shadow-1">
              <EmptyState
                illustration="parcel"
                title="No orders yet"
                body="When you buy with a Vekro link, it shows up here."
              />
            </div>
          )}
          {p.state === 'ready' && (
            <ul className={cn('flex flex-col gap-3', p.staleSince && 'opacity-60')}>
              {p.recent.map((card) => (
                <li key={card.id}>
                  <BuyerOrderCardView card={card} serverOffsetMs={p.serverOffsetMs} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {p.showStartSelling && (
        <Link
          to="/buyer/start-selling"
          className="flex items-center gap-4 rounded-lg bg-emerald-50 p-5 text-emerald-800 hover:bg-emerald-100"
        >
          <Store aria-hidden="true" className="size-8 shrink-0" />
          <span className="flex flex-col">
            <span className="type-title">Sell on Vekro too</span>
            <span className="type-body-sm">Open a store on this same account.</span>
          </span>
        </Link>
      )}
    </div>
  )
}
