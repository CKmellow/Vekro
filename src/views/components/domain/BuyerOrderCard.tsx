import { Package } from 'lucide-react'
import { Link } from 'react-router'
import type { BuyerOrderCard } from '@/controllers/useMyOrders'
import { cn } from '@/lib/cn'
import { MoneyText } from '../ui/MoneyText'
import { MiniCountdown } from './MiniCountdown'
import { StatusPill } from './StatusPill'

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

/** One order in the buyer area (B9, B10, B11): a link to the B3 tracker. */
export function BuyerOrderCardView({
  card,
  serverOffsetMs,
}: {
  card: BuyerOrderCard
  serverOffsetMs: number
}) {
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
