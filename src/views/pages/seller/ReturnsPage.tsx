import { Package } from 'lucide-react'
import { Link } from 'react-router'
import { useReturnsInbox, type ReturnCard } from '@/controllers/useReturnsInbox'
import { cn } from '@/lib/cn'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { StatusPill } from '../../components/domain/StatusPill'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { MoneyText } from '../../components/ui/MoneyText'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { Tabs } from '../../components/ui/Tabs'

function Card({ card, offsetMs, primary }: { card: ReturnCard; offsetMs: number; primary: boolean }) {
  return (
    <li className="flex flex-col gap-4 rounded-lg bg-surface p-5 shadow-1">
      <div className="flex items-start gap-3">
        {card.photoUrl ? (
          <img src={card.photoUrl} alt="" className="size-12 rounded-sm border border-border object-cover" />
        ) : (
          <span className="grid size-12 shrink-0 place-items-center rounded-sm bg-sand-100 text-ink-400">
            <Package aria-hidden="true" className="size-5" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="type-body-md truncate font-semibold text-text">{card.title}</p>
          <p className="type-body-sm text-text-muted">
            <span className="type-mono">{card.reference}</span> · <MoneyText amount={card.amount} />
          </p>
        </div>
        {card.deadline && (
          <CountdownRing
            deadline={card.deadline.at}
            totalMs={card.deadline.totalMs}
            serverOffsetMs={offsetMs}
            label={card.deadline.line}
          />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {card.category && (
          <span className="type-body-sm rounded-full bg-coral-50 px-3 py-1 font-semibold text-coral-600">
            {card.category}
          </span>
        )}
        <StatusPill status={card.status} />
      </div>
      {card.deadline && <p className="type-body-sm text-ink-600">{card.deadline.line}.</p>}
      <Link
        to={`/seller/returns/${card.id}`}
        className={cn(
          'type-body-md mt-auto inline-flex h-11 items-center justify-center rounded-md px-4 font-semibold',
          primary
            ? 'bg-primary text-on-primary shadow-highlight hover:bg-primary-hover'
            : 'border border-border bg-surface text-text hover:bg-sand-100',
        )}
      >
        Open case<span className="sr-only"> for {card.reference}</span>
      </Link>
    </li>
  )
}

/** S10 Returns inbox (design/S10-returns). Route /seller/returns. */
export function ReturnsPage() {
  const p = useReturnsInbox()
  const panel =
    p.state === 'loading' ? (
      <SkeletonGroup label="Loading returns">
        <div className="grid gap-4 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-44 w-full rounded-lg" />
          ))}
        </div>
      </SkeletonGroup>
    ) : p.state === 'error' ? (
      <Banner
        tone="danger"
        title="We couldn't load your returns."
        action={
          <Button variant="secondary" className="h-10" onClick={p.retry}>
            Try again
          </Button>
        }
      />
    ) : p.state === 'no_returns' ? (
      <div className="rounded-lg bg-surface shadow-1">
        <EmptyState
          illustration="done"
          title="No returns. Good sign."
          body="Returns only happen when a buyer reports a fault during the 24-hour hold on serialized items."
        />
      </div>
    ) : p.state === 'tab_empty' ? (
      <div className="flex flex-col items-center gap-1 rounded-lg bg-surface px-5 py-12 text-center shadow-1">
        <p className="type-title text-text">{p.empty[0]}</p>
        {p.empty[1] && <p className="type-body-sm text-text-muted">{p.empty[1]}</p>}
      </div>
    ) : (
      <ul className={cn('grid gap-4 lg:grid-cols-2', p.staleSince && 'opacity-70')} aria-label="Return cases">
        {p.cards.map((card) => (
          <Card key={card.id} card={card} offsetMs={p.serverOffsetMs} primary={p.primary} />
        ))}
      </ul>
    )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="type-display-lg text-text">Returns</h1>
        <p className="type-body-md text-text-muted">
          When a buyer reports a problem with a serialized item, the money stays in escrow until the case is
          settled.
        </p>
      </div>
      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}
      <Tabs
        label="Return cases"
        value={p.tab}
        onValueChange={p.setTab}
        items={p.tabs.map((t) => ({
          value: t.value,
          label: t.count !== undefined ? `${t.label} (${t.count})` : t.label,
          content: t.value === p.tab ? panel : null,
        }))}
      />
    </div>
  )
}
