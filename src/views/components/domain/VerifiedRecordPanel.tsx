import {
  CloudOff,
  Download,
  ExternalLink,
  Hourglass,
  ShieldAlert,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { Sheet } from '../ui/Sheet'

export type RecordState = 'checking' | 'verified' | 'pending' | 'tampered' | 'unavailable'

export interface HeldMoney {
  state: 'included' | 'pending' | 'tampered' | 'unavailable'
  amount: string
  total: string
}

export interface VerifiedRecordPanelProps {
  state: RecordState
  /** Steps sealed on the public record, of all recorded. */
  sealed: number
  total: number
  network: string
  registry: string
  batches: { id: number; block: number | null; txUrl: string | null }[]
  /** Buyer only: their held money in Vekro's published total; null hides the line. */
  heldMoney?: HeldMoney | null
  detailsOpen: boolean
  onDetailsOpenChange: (open: boolean) => void
  onRetry: () => void
  onDownload?: () => void
}

const LOOK: Record<RecordState, { Icon: LucideIcon; title: string; tone: string; icon: string }> = {
  checking: {
    Icon: Hourglass,
    title: 'Checking the seal…',
    tone: 'bg-surface',
    icon: 'bg-sand-100 text-ink-600',
  },
  verified: {
    Icon: ShieldCheck,
    title: 'Tamper-evident record',
    tone: 'bg-surface',
    icon: 'bg-emerald-50 text-primary',
  },
  pending: {
    Icon: Hourglass,
    title: 'Sealing in progress',
    tone: 'bg-surface',
    icon: 'bg-lake-50 text-lake-600',
  },
  tampered: {
    Icon: ShieldAlert,
    title: "This record doesn't match its seal",
    tone: 'bg-coral-50',
    icon: 'bg-surface text-coral-600',
  },
  unavailable: {
    Icon: CloudOff,
    title: "Can't check the seal right now",
    tone: 'bg-surface',
    icon: 'bg-sand-100 text-ink-600',
  },
}

function heldMoneyLine({ state, amount, total }: HeldMoney): string {
  if (state === 'included')
    return `Your ${amount} is included in Vekro's published total of held money (${total}).`
  if (state === 'pending')
    return `Your ${amount} is in Vekro's latest total of held money. It is published within a few minutes.`
  if (state === 'tampered')
    return `Your ${amount} could not be matched to Vekro's published total of held money. Contact Vekro support.`
  return "Vekro's published total of held money can't be checked right now. Your money is not affected."
}

function body(state: RecordState, sealed: number, total: number): string {
  if (state === 'verified') return 'Every step of this order is sealed on a public record and checks out.'
  if (state === 'pending')
    return `${sealed} of ${total} steps are sealed and check out. The latest ones are sealed within a few minutes.`
  if (state === 'tampered') return 'Contact Vekro support. Keep the receipt below: it shows what was sealed.'
  if (state === 'unavailable') return 'Your order and your money are not affected. Try again in a moment.'
  return 'Your browser is checking this order against the public record.'
}

/**
 * B3 and S6 "Verified record" (#279): the order's history checked in this browser against a public
 * record Vekro cannot change. Plain words only; the technical details sit in a sheet.
 */
export function VerifiedRecordPanel(p: VerifiedRecordPanelProps) {
  const look = LOOK[p.state]
  return (
    <Card className={cn('flex flex-col gap-3', look.tone)} aria-live="polite">
      <div className="flex items-start gap-3">
        <span className={cn('grid size-11 shrink-0 place-items-center rounded-md', look.icon)}>
          <look.Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="type-body-md font-semibold text-text">{look.title}</h2>
          <p className="type-body-sm text-text-muted">{body(p.state, p.sealed, p.total)}</p>
        </div>
      </div>
      {p.heldMoney && (
        <p
          className={cn(
            'type-body-sm rounded-md bg-sand-50 px-3 py-2',
            p.heldMoney.state === 'tampered' ? 'text-coral-600' : 'text-ink-600',
          )}
        >
          {heldMoneyLine(p.heldMoney)}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {p.state === 'unavailable' && (
          <Button variant="secondary" onClick={p.onRetry}>
            Try again
          </Button>
        )}
        {p.state !== 'checking' && p.state !== 'unavailable' && (
          <Button variant="ghost" onClick={() => p.onDetailsOpenChange(true)}>
            How this works
          </Button>
        )}
      </div>
      <Sheet
        open={p.detailsOpen}
        onOpenChange={p.onDetailsOpenChange}
        title="How your record is sealed"
        description="Vekro holds the money. A public record holds Vekro to account."
        footer={
          p.onDownload && (
            <Button variant="secondary" onClick={p.onDownload}>
              <Download aria-hidden="true" className="size-4" /> Download receipt
            </Button>
          )
        }
      >
        <div className="type-body-sm flex flex-col gap-3 text-ink-600">
          <p>
            Every payment, status change and decision on this order is fingerprinted and sealed, in batches,
            on a public record that nobody can edit afterwards, Vekro included. Your browser checked{' '}
            <span className="font-semibold text-text">
              {p.sealed} of {p.total}
            </span>{' '}
            steps against that record itself, without trusting Vekro's servers.
          </p>
          <p>Only fingerprints are public. Your name, phone and order details are never published.</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            <dt className="text-text-muted">Public record</dt>
            <dd className="text-text">{p.network}</dd>
            <dt className="text-text-muted">Registry</dt>
            <dd className="type-mono truncate text-text">{p.registry}</dd>
          </dl>
          {p.batches.length > 0 && (
            <ul className="flex flex-col gap-1">
              {p.batches.map((batch) => (
                <li key={batch.id} className="flex items-center justify-between gap-2">
                  <span>
                    Seal {batch.id}
                    {batch.block !== null && <span className="text-text-muted"> · block {batch.block}</span>}
                  </span>
                  {batch.txUrl && (
                    <a
                      href={batch.txUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex min-h-11 items-center gap-1 font-semibold text-primary"
                    >
                      View <ExternalLink aria-hidden="true" className="size-3.5" />
                      <span className="sr-only"> seal {batch.id} on the public record</span>
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          <p>The receipt lets anyone check this order again later, even without Vekro.</p>
        </div>
      </Sheet>
    </Card>
  )
}
