import { ArrowLeft, Phone } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { REASON_MAX, useAdminCase } from '@/controllers/useAdminCase'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { MoneyPath } from '../../components/domain/MoneyPath'
import { Timeline } from '../../components/domain/Timeline'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { MoneyText } from '../../components/ui/MoneyText'

const AGE_TONE = {
  sand: 'bg-dark-surface-raised text-dark-text-muted',
  saffron: 'bg-saffron-500/15 text-saffron-500',
  coral: 'bg-coral-500/15 text-coral-500',
}
const panel = 'rounded-lg border border-dark-border bg-dark-surface p-5'
const quote = 'type-body-sm rounded-md border-l-4 bg-dark-surface-raised px-4 py-3 italic'
const field =
  'w-full rounded-sm border border-dark-border bg-dark-background px-3 text-dark-text focus:border-plum-500 focus:outline-none'

/** A3 Case detail and decision (design/A3-case). Route /admin/cases/:id. */
export function CasePage() {
  const p = useAdminCase()
  const reduce = useReducedMotion()

  if (p.state === 'loading')
    return (
      <div role="status" aria-label="Loading the case" className="grid grid-cols-12 gap-6">
        <div className="col-span-7 h-96 animate-pulse rounded-lg bg-dark-surface" />
        <div className="col-span-5 h-96 animate-pulse rounded-lg bg-dark-surface" />
      </div>
    )
  if (p.state === 'not_found' || (p.state === 'ready' && !p.caseView))
    return (
      <div className="flex flex-col items-center gap-3 rounded-lg bg-dark-surface px-6 py-16 text-center">
        <h1 className="type-title">This case doesn't exist</h1>
        <Link to="/admin" className="type-body-md font-semibold text-plum-500">
          Back to queue
        </Link>
      </div>
    )
  if (p.state === 'error' || !p.caseView)
    return (
      <div role="alert" className="flex items-center justify-between rounded-md bg-coral-500/15 px-4 py-3">
        <h1 className="type-body-md text-coral-500">We couldn't load this case.</h1>
        <button
          type="button"
          onClick={p.retry}
          className="type-body-md min-h-10 rounded-sm border border-dark-border px-4"
        >
          Try again
        </button>
      </div>
    )

  const c = p.caseView
  const share = c.amount > 0 ? (p.seller / c.amount) * 100 : 50
  const options = [
    {
      value: 'refund' as const,
      title: 'Refund buyer',
      body: `${c.buyer.name} gets KES ${c.amount.toLocaleString('en-KE')}.`,
    },
    {
      value: 'release' as const,
      title: 'Release to seller',
      body: `${c.seller.name} gets KES ${c.amount.toLocaleString('en-KE')}.`,
    },
    { value: 'split' as const, title: 'Split', body: 'Divide the money between them.' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/admin"
          className="type-body-md inline-flex min-h-11 items-center gap-1 text-dark-text-muted hover:text-dark-text"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Queue
        </Link>
        <h1 className="type-headline font-mono">{c.caseId}</h1>
        <span className="type-mono text-dark-text-muted">{c.reference}</span>
        {c.trigger && <span className="type-body-sm rounded-full bg-plum-500/20 px-3 py-1">{c.trigger}</span>}
        <span className="type-headline ml-auto">
          <MoneyText amount={c.amount} />
        </span>
        {!c.decided && (
          <span className={cn('type-mono rounded-full px-3 py-1', AGE_TONE[c.age.tone])}>{c.age.label}</span>
        )}
      </div>

      {p.staleSince && (
        <p role="status" className="type-body-sm rounded-md bg-saffron-500/15 px-4 py-3 text-saffron-500">
          You're offline. Showing the last update at <span className="font-mono">{p.staleSince}</span>.
          Decisions need a connection.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              {
                label: 'Buyer',
                p: c.buyer,
                extra: `${c.buyer.orders} order${c.buyer.orders === 1 ? '' : 's'} with Vekro`,
              },
              {
                label: 'Seller',
                p: c.seller,
                extra: `${c.seller.completedSales} completed sales · ${Math.round(c.seller.disputeRate * 100)}% with a dispute`,
              },
            ].map(({ label, p: party, extra }) => (
              <section key={label} aria-label={label} className={panel}>
                <p className="type-label text-dark-text-muted">{label}</p>
                <p className="type-title">{party.name}</p>
                <a
                  href={party.tel}
                  className="type-body-md inline-flex min-h-10 items-center gap-2 font-mono text-dark-text hover:text-plum-500"
                >
                  <Phone aria-hidden="true" className="size-4" />
                  {party.phone}
                  <span className="sr-only">, call the {label.toLowerCase()}</span>
                </a>
                <p className="type-body-sm text-dark-text-muted">{extra}</p>
              </section>
            ))}
          </div>

          <section aria-label="Item" className={panel}>
            <p className="type-title">{c.itemTitle}</p>
            {c.serial && <p className="type-mono text-dark-text-muted">Serial {c.serial}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              {c.policy.map((name) => (
                <span key={name} className="type-body-sm rounded-full bg-dark-surface-raised px-3 py-1">
                  {name}
                </span>
              ))}
            </div>
            <p className="type-body-sm mt-2 text-dark-text-muted">The seller's declared policy.</p>
          </section>

          <div className="grid gap-4 sm:grid-cols-2">
            <section aria-label="Buyer says" className={panel}>
              <h2 className="type-label mb-2 text-dark-text-muted">Buyer says</h2>
              {c.buyerSays.category && (
                <span className="type-body-sm rounded-full bg-coral-500/15 px-3 py-1 text-coral-500">
                  {c.buyerSays.category}
                </span>
              )}
              <blockquote className={cn(quote, 'mt-3 border-coral-500')}>
                "{c.buyerSays.description}"
              </blockquote>
              {c.buyerSays.note && <p className="type-body-sm mt-2">Latest note: "{c.buyerSays.note}"</p>}
            </section>
            <section aria-label="Seller says" className={panel}>
              <h2 className="type-label mb-2 text-dark-text-muted">Seller says</h2>
              {c.sellerSays ? (
                <>
                  <p className="type-body-md">{c.sellerSays.action}</p>
                  {c.sellerSays.note && (
                    <blockquote className={cn(quote, 'mt-3 border-emerald-500')}>
                      "{c.sellerSays.note}"
                    </blockquote>
                  )}
                </>
              ) : (
                <p className="type-body-md text-dark-text-muted">No response yet</p>
              )}
              {c.escalation && (
                <p className="type-body-sm mt-3">
                  <span className="font-semibold">{c.escalation.by} escalated:</span> "{c.escalation.reason}"
                </p>
              )}
            </section>
          </div>

          <section aria-label="Timeline" className={cn(panel, 'bg-surface text-text [color-scheme:light]')}>
            <h2 className="type-title mb-3">Timeline</h2>
            <Timeline entries={c.timeline} label="Case timeline" />
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:col-span-5">
          {c.decided ? (
            <section
              aria-label="Decision"
              className={cn(panel, 'flex flex-col gap-4 bg-dark-surface-raised')}
            >
              <h2 className="type-title">Decided</h2>
              <p className="type-body-md">{c.decided.sentence}</p>
              {c.decided.reason && (
                <blockquote className={cn(quote, 'border-plum-500')}>"{c.decided.reason}"</blockquote>
              )}
              <p className="type-body-sm text-dark-text-muted">
                By {c.decided.by}
                {c.decided.at && <> · {c.decided.at}</>}
              </p>
              <div className="rounded-md bg-surface p-4 text-text [color-scheme:light]">
                <MoneyPath
                  buyer={{ title: 'Buyer' }}
                  vault={{ title: 'Vekro vault' }}
                  seller={{ title: 'Seller' }}
                  position={c.decided.moneyAt}
                />
              </div>
            </section>
          ) : (
            <section
              aria-label="Decision"
              className={cn(panel, 'flex flex-col gap-4 bg-dark-surface-raised')}
            >
              <h2 className="type-title">Decision</h2>
              {p.failure && (
                <div role="alert" className="flex flex-col gap-2 rounded-md bg-coral-500/15 px-4 py-3">
                  <p className="type-body-sm text-coral-500">{p.failure}</p>
                  <button
                    type="button"
                    onClick={() => void p.execute()}
                    className="type-body-sm min-h-10 self-start rounded-sm border border-dark-border px-4"
                  >
                    Retry
                  </button>
                </div>
              )}
              <fieldset className="flex flex-col gap-3" disabled={p.executing}>
                <legend className="sr-only">Decision</legend>
                {options.map((o) => {
                  const disabled = o.value === 'split' && p.splitUnsupported
                  const selected = p.decision === o.value
                  return (
                    <label
                      key={o.value}
                      className={cn(
                        'flex cursor-pointer flex-col gap-1 rounded-md border p-4 transition-colors',
                        selected ? 'border-plum-500 bg-plum-500/10' : 'border-dark-border',
                        disabled && 'cursor-not-allowed opacity-50',
                        'has-focus-visible:ring-2 has-focus-visible:ring-plum-500',
                      )}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="decision"
                          value={o.value}
                          checked={selected}
                          disabled={disabled}
                          onChange={() => p.setDecision(o.value)}
                          className="size-5 accent-plum-500"
                        />
                        <span className="type-body-md font-semibold">{o.title}</span>
                      </span>
                      <span className="type-body-sm pl-8 text-dark-text-muted">{o.body}</span>
                      {disabled && (
                        <span className="type-body-sm pl-8 text-coral-500">
                          Split payouts aren't available with the current payment provider. Choose refund or
                          release.
                        </span>
                      )}
                    </label>
                  )
                })}
              </fieldset>
              {p.errors.decision && (
                <p role="alert" className="type-body-sm text-coral-500">
                  {p.errors.decision}
                </p>
              )}

              {p.decision === 'split' && (
                <motion.div
                  initial={reduce ? false : { opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: reduce ? 0 : duration.state }}
                  className="flex flex-col gap-3"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="type-label text-dark-text-muted">To the buyer (KES)</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={c.amount - 1}
                        value={p.buyer}
                        onChange={(e) => p.setBuyerAmount(Number(e.target.value))}
                        className={cn(field, 'h-11 font-mono')}
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="type-label text-dark-text-muted">To the seller (KES)</span>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={c.amount - 1}
                        value={p.seller}
                        onChange={(e) => p.setSellerAmount(Number(e.target.value))}
                        className={cn(field, 'h-11 font-mono')}
                      />
                    </label>
                  </div>
                  <div aria-hidden="true" className="flex h-3 overflow-hidden rounded-full">
                    <div
                      className="bg-lake-500 transition-[width] duration-(--duration-state)"
                      style={{ width: `${100 - share}%` }}
                    />
                    <div
                      className="bg-emerald-500 transition-[width] duration-(--duration-state)"
                      style={{ width: `${share}%` }}
                    />
                  </div>
                  <p className="type-body-sm text-dark-text-muted">
                    Buyer {Math.round(100 - share)}% · Seller {Math.round(share)}%. Network fees are deducted
                    when each payout is sent.
                  </p>
                  {p.errors.split && (
                    <p role="alert" className="type-body-sm text-coral-500">
                      {p.errors.split}
                    </p>
                  )}
                </motion.div>
              )}

              <div className="flex flex-col gap-1">
                <label htmlFor="decision-reason" className="type-label text-dark-text-muted">
                  Reason for the decision
                </label>
                <textarea
                  id="decision-reason"
                  value={p.reason}
                  maxLength={REASON_MAX}
                  disabled={p.executing}
                  onChange={(e) => p.setReason(e.target.value)}
                  aria-invalid={p.errors.reason ? true : undefined}
                  aria-describedby="reason-help"
                  className={cn(field, 'min-h-28 py-2')}
                />
                <span
                  id="reason-help"
                  className={cn('type-body-sm', p.errors.reason ? 'text-coral-500' : 'text-dark-text-muted')}
                >
                  {p.errors.reason ?? 'Shown to both parties and logged.'} ({p.reasonLength}/{REASON_MAX})
                </span>
              </div>
              <Button
                variant="console"
                fullWidth
                disabled={p.executing}
                loading={p.executing}
                onClick={p.review}
              >
                Review decision
              </Button>
              {p.executing && (
                <p className="type-body-sm text-dark-text-muted">Executing… don't close this page.</p>
              )}
            </section>
          )}
        </aside>
      </div>

      <ConfirmDialog
        open={p.confirming}
        onOpenChange={(open) => !open && p.cancelConfirm()}
        title="Confirm this decision"
        body={p.sentence}
        confirmLabel="Confirm and execute"
        confirmVariant="console"
        confirmDisabled={!p.typedOk}
        onConfirm={() => void p.execute()}
        loading={p.executing}
      >
        <blockquote className="type-body-sm rounded-md bg-sand-100 px-4 py-3 text-ink-600 italic">
          "{p.reason.trim()}"
        </blockquote>
        <label className="flex flex-col gap-1">
          <span className="type-label text-ink-600">Type {c.caseId} to confirm</span>
          <input
            value={p.typed}
            onChange={(e) => p.setTyped(e.target.value)}
            autoComplete="off"
            className="h-11 rounded-sm border border-border px-3 font-mono focus:border-plum-500 focus:outline-none"
          />
        </label>
      </ConfirmDialog>
    </div>
  )
}
