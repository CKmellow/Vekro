import { ArrowLeft, Package } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router'
import { DESCRIPTION_MAX, DESCRIPTION_MIN, useReportIssue } from '@/controllers/useReportIssue'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { MiniCountdown } from '../../components/domain/MiniCountdown'
import { Timeline } from '../../components/domain/Timeline'
import { VaultCard } from '../../components/domain/VaultCard'
import { ActionDock } from '../../components/ui/ActionDock'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Choice'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextArea } from '../../components/ui/Field'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

/** B5 Report an issue (design/B5-report-issue). Route /order/:orderId/report. */
export function ReportIssuePage() {
  const { orderId = '' } = useParams()
  const p = useReportIssue(orderId)
  const reduce = useReducedMotion()
  const { state, toReturn } = p

  useEffect(() => {
    if (state === 'already_reported') toReturn()
  }, [state, toReturn])

  const header = (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={p.back}
        aria-label="Back to your order"
        className="grid size-12 place-items-center rounded-full text-ink-600 hover:bg-sand-100"
      >
        <ArrowLeft aria-hidden="true" className="size-6" />
      </button>
      <h1 className="type-title flex-1 text-text">Report a problem</h1>
      {p.deadline && state === 'form' && (
        <span className="rounded-full bg-saffron-50 px-3 py-1.5">
          <MiniCountdown
            deadline={p.deadline.at}
            totalMs={p.deadline.totalMs}
            serverOffsetMs={p.deadline.serverOffsetMs}
            label="left to report"
          />
        </span>
      )}
    </div>
  )

  if (state === 'loading' || state === 'already_reported')
    return (
      <SkeletonGroup label="Loading your order">
        <Skeleton className="h-12 w-2/3" />
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </SkeletonGroup>
    )
  if (state === 'not_found')
    return (
      <>
        <h1 className="sr-only">Report a problem</h1>
        <EmptyState
          illustration="parcel"
          title="We can't find this order"
          body="Check the link in your SMS, or log in with the phone you paid with."
        />
      </>
    )
  if (state === 'error')
    return (
      <>
        <h1 className="sr-only">Report a problem</h1>
        <Banner
          tone="danger"
          title="We couldn't load your order."
          action={
            <Button variant="secondary" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      </>
    )
  if (state === 'not_eligible')
    return (
      <div className="flex flex-col gap-4">
        {header}
        <EmptyState
          illustration="done"
          title="Sales of this type are final once you give your code."
          body="Reporting a problem afterwards is only for items with a serial number, during their 24-hour hold."
          action={
            <Button variant="secondary" onClick={p.back}>
              Back to your order
            </Button>
          }
        />
      </div>
    )

  if (state === 'success') {
    const support = p.submitted === 'other'
    return (
      <AnimatePresence mode="wait">
        <m.div
          key="success"
          initial={reduce ? false : { opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0 : duration.state }}
          className="flex flex-col gap-5 pb-32"
        >
          <VaultCard
            reference={p.item?.reference ?? ''}
            amountLabel="Held in the vault"
            amount={p.item?.amount ?? 0}
            status={{
              label: support ? 'With Vekro support' : 'Issue reported',
              tone: support ? 'plum' : 'coral',
              icon: support ? 'shield' : 'alert',
            }}
            ring={support ? 'plum' : 'coral'}
          />
          <h2 className="type-headline text-text" aria-live="polite">
            {support ? 'Vekro support has your report' : "We've told the seller"}
          </h2>
          {support ? (
            <p className="type-body-md text-ink-600">
              We'll message you by SMS. Your money stays in the vault until it's decided.
            </p>
          ) : (
            <ol className="type-body-md flex list-decimal flex-col gap-2 pl-5 text-ink-600">
              <li>Send the item back to {p.item?.sellerName}.</li>
              <li>Tap "I've sent it back" so the seller knows it's coming.</li>
            </ol>
          )}
          <ActionDock>
            <Button
              fullWidth
              onClick={() => p.go(support ? `/order/${orderId}` : `/order/${orderId}/return`)}
            >
              {support ? 'See your order' : 'Next: send the item back'}
            </Button>
          </ActionDock>
        </m.div>
      </AnimatePresence>
    )
  }

  const closed = state === 'closed'
  const disabled = closed || p.submitting
  return (
    <div className="flex flex-col gap-5 pb-36">
      {header}
      <div>
        <h2 className="type-headline text-text">What's wrong with your item?</h2>
        <p className="type-body-md text-text-muted">Your money stays held while we sort this out.</p>
      </div>

      {closed && (
        <Banner
          tone="warning"
          title="The reporting window has closed."
          action={
            <Link to="/help" className="type-body-md font-semibold text-primary">
              Get help
            </Link>
          }
        />
      )}
      {!p.online && (
        <Banner tone="warning" title="You're offline. Your report stays here until you're back." />
      )}
      {p.submitError && <Banner tone="danger" title={p.submitError} />}

      {p.item && (
        <Card className="flex items-center gap-4">
          {p.item.photoUrl ? (
            <img
              src={p.item.photoUrl}
              alt=""
              className="size-14 rounded-md border border-border object-cover"
            />
          ) : (
            <span className="grid size-14 shrink-0 place-items-center rounded-md bg-sand-100 text-ink-400">
              <Package aria-hidden="true" className="size-6" />
            </span>
          )}
          <div className="min-w-0">
            <p className="type-body-md truncate font-semibold text-text">{p.item.title}</p>
            {p.item.serialTail && <p className="type-mono text-text-muted">Serial ••••{p.item.serialTail}</p>}
          </div>
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <fieldset disabled={disabled} className="flex flex-col gap-3">
          <legend className="type-title mb-1 text-text">Choose the problem</legend>
          {p.categories.map((c) => {
            const selected = p.category === c.value
            return (
              <label
                key={c.value}
                className={cn(
                  'flex min-h-14 cursor-pointer items-center gap-3 rounded-md border bg-surface px-4 py-3',
                  'transition-[border-color,box-shadow,transform] duration-(--duration-tap) ease-standard',
                  selected ? 'border-emerald-600 shadow-2 motion-safe:-translate-y-0.5' : 'border-border',
                  'has-focus-visible:ring-4 has-focus-visible:ring-emerald-100 has-disabled:cursor-not-allowed has-disabled:opacity-60',
                )}
              >
                <input
                  type="radio"
                  name="category"
                  value={c.value}
                  checked={selected}
                  onChange={() => p.setCategory(c.value)}
                  className="size-5 accent-emerald-700"
                />
                <span className="type-body-md flex-1 font-semibold text-text">{c.label}</span>
                {c.value === 'other' && (
                  <span className="type-body-sm shrink-0 rounded-full bg-plum-50 px-2 whitespace-nowrap text-plum-700">
                    Goes to Vekro support
                  </span>
                )}
              </label>
            )
          })}
        </fieldset>
        {p.errors.category && (
          <p role="alert" className="type-body-sm text-coral-600">
            {p.errors.category}
          </p>
        )}
        {p.covered.length > 0 && (
          <p className="type-body-sm text-text-muted">
            {p.item?.sellerName} covers: {p.covered.join(', ')}.
          </p>
        )}
      </Card>

      <Card>
        <h3 className="type-title mb-3 text-text">Tell us more</h3>
        <TextArea
          label="What's happening?"
          hint="What happens? When did it start?"
          error={p.errors.description}
          value={p.description}
          disabled={disabled}
          onChange={(e) => p.setDescription(e.target.value)}
        />
        <p
          className={cn(
            'type-mono mt-2 text-right transition-colors',
            p.descriptionLength > 0 &&
              (p.descriptionLength < DESCRIPTION_MIN || p.descriptionLength > DESCRIPTION_MAX)
              ? 'text-coral-600'
              : 'text-text-muted',
          )}
        >
          {p.descriptionLength}/{DESCRIPTION_MAX}
        </p>
      </Card>

      <Card>
        <h3 className="type-title mb-3 text-text">What happens next</h3>
        <Timeline
          label="What happens next"
          entries={p.steps.map((text) => ({ id: text, text, upcoming: true }))}
        />
        {p.category !== 'other' && (
          <p className="type-body-sm mt-2 text-text-muted">
            The seller must follow the policy they declared when listing.
          </p>
        )}
      </Card>

      {p.needsConfirm && (
        <div>
          <Checkbox
            checked={p.confirmed}
            disabled={disabled}
            onChange={(e) => p.setConfirmed(e.target.checked)}
          >
            I understand I need to send the item back.
          </Checkbox>
          {p.errors.confirmed && (
            <p role="alert" className="type-body-sm text-coral-600">
              {p.errors.confirmed}
            </p>
          )}
        </div>
      )}

      <ActionDock>
        <Button
          fullWidth
          loading={p.submitting}
          disabled={closed || !p.online}
          onClick={() => void p.submit()}
        >
          Submit report
        </Button>
        <Button variant="ghost" fullWidth onClick={p.back}>
          Cancel
        </Button>
      </ActionDock>
    </div>
  )
}
