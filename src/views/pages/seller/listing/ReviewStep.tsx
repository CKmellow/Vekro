import { Clock, Package, Pencil, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatKes } from '@/lib/money'
import { Banner } from '../../../components/ui/Banner'

export interface ReviewStepProps {
  title: string
  category: string
  price: number
  photoCount: number
  photoUrl: string | null
  isSerialized: boolean
  uniqueIdTail: string | null
  policyLine: string
  payout: { gross: number; fee: number; net: number }
  linkHost: string
  onEdit: (step: number) => void
  error: string | null
}

function Section({
  title,
  step,
  onEdit,
  children,
}: {
  title: string
  step: number
  onEdit: (s: number) => void
  children: ReactNode
}) {
  return (
    <section aria-label={title} className="flex flex-col gap-3 rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <h3 className="type-title text-text">{title}</h3>
        <button
          type="button"
          onClick={() => onEdit(step)}
          className="type-body-sm inline-flex min-h-10 items-center gap-1.5 font-semibold text-primary"
        >
          <Pencil aria-hidden="true" className="size-4" />
          Edit<span className="sr-only"> {title.toLowerCase()}</span>
        </button>
      </div>
      {children}
    </section>
  )
}

/** S7 step 4: check everything, see the payout and how the link looks when shared. */
export function ReviewStep(p: ReviewStepProps) {
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h2 className="type-headline text-text">Review</h2>
        <p className="type-body-md mt-1 text-text-muted">
          Check everything before you publish. Once a buyer pays, the price and policy can&apos;t change.
        </p>
      </div>
      {p.error && <Banner tone="danger" title={p.error} />}

      <Section title="Item" step={0} onEdit={p.onEdit}>
        <div className="flex items-center gap-4">
          <span className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-md bg-sand-100 text-ink-400">
            {p.photoUrl ? (
              <img src={p.photoUrl} alt="" className="size-full object-cover" />
            ) : (
              <Package aria-hidden="true" className="size-6" />
            )}
          </span>
          <div className="min-w-0">
            <p className="type-label text-text-muted">{p.category}</p>
            <p className="type-title truncate text-text">{p.title}</p>
            <p className="type-body-md text-text">
              {formatKes(p.price)} · {p.photoCount} {p.photoCount === 1 ? 'photo' : 'photos'}
            </p>
          </div>
        </div>
      </Section>

      <Section title="Item type" step={1} onEdit={p.onEdit}>
        <p className="type-body-md flex flex-wrap items-center gap-2 text-text">
          <span
            className={
              p.isSerialized
                ? 'rounded-full bg-lake-50 px-3 py-0.5 text-lake-600'
                : 'rounded-full bg-sand-100 px-3 py-0.5 text-ink-600'
            }
          >
            {p.isSerialized ? 'Serial-numbered' : 'Standard'}
          </span>
          {p.uniqueIdTail && <span className="type-mono">Serial ends {p.uniqueIdTail}</span>}
        </p>
      </Section>

      <Section title="Dispute policy" step={2} onEdit={p.onEdit}>
        <p className="type-body-md flex items-start gap-2 text-ink-600">
          {p.isSerialized ? (
            <Clock aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-saffron-700" />
          ) : (
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-700" />
          )}
          {p.policyLine}
        </p>
      </Section>

      <section aria-label="Your payout" className="flex flex-col gap-2 rounded-lg border border-border p-5">
        <h3 className="type-title text-text">Your payout</h3>
        <dl className="type-body-md flex flex-col gap-1.5">
          <div className="flex justify-between">
            <dt className="text-ink-600">Price</dt>
            <dd className="type-mono">{formatKes(p.payout.gross)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-ink-600">Estimated network fee</dt>
            <dd className="type-mono text-ink-600">− {formatKes(p.payout.fee)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="font-semibold text-text">You receive</dt>
            <dd className="type-title text-emerald-700">{formatKes(p.payout.net)}</dd>
          </div>
        </dl>
        <p className="type-body-sm text-text-muted">Sent to your M-Pesa after the buyer accepts the item.</p>
      </section>

      <section aria-label="Link preview" className="flex flex-col gap-3 rounded-lg border border-border p-5">
        <div className="flex items-baseline justify-between">
          <h3 className="type-title text-text">Link preview</h3>
          <span className="type-body-sm text-text-muted">How it looks on WhatsApp</span>
        </div>
        <div className="rounded-md bg-sand-100 p-4">
          <div className="max-w-72 overflow-hidden rounded-md bg-surface shadow-1">
            <div className="bg-vault flex items-center gap-3 p-3 text-sand-0">
              <span className="grid size-12 shrink-0 place-items-center overflow-hidden rounded-sm bg-emerald-900">
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="size-full object-cover" />
                ) : (
                  <Package aria-hidden="true" className="size-5" />
                )}
              </span>
              <span className="type-body-sm font-semibold">{p.title}</span>
            </div>
            <div className="flex flex-col gap-0.5 p-3">
              <span className="type-body-sm font-semibold text-text">
                {p.title} · {formatKes(p.price)}
              </span>
              <span className="type-body-sm text-text-muted">Pay safely with Vekro escrow</span>
              <span className="type-mono text-primary">{p.linkHost}/pay/…</span>
            </div>
          </div>
        </div>
        <p className="type-body-sm text-text-muted">Your link is ready to copy as soon as you publish.</p>
      </section>
    </div>
  )
}
