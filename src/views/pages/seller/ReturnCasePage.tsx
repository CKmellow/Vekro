import {
  ArrowLeft,
  CircleCheck,
  Clock,
  Package,
  ShieldCheck,
  Wrench,
  Coins,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect } from 'react'
import { Link } from 'react-router'
import { NOTE_MAX, REASON_MAX, useReturnCase, type CasePanel } from '@/controllers/useReturnCase'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { StatusPill } from '../../components/domain/StatusPill'
import { ActionDock } from '../../components/ui/ActionDock'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextArea } from '../../components/ui/Field'
import { MoneyText } from '../../components/ui/MoneyText'
import { Sheet } from '../../components/ui/Sheet'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { TimelinePanel } from '../buyer/timeline/TimelinePanel'

const TONE: Record<CasePanel['tone'], string> = {
  lake: 'bg-lake-50',
  saffron: 'bg-saffron-50',
  emerald: 'bg-emerald-50',
  plum: 'bg-plum-50',
  sand: 'bg-sand-100',
}
const OPTION_ICON: Record<string, LucideIcon> = {
  refund_issued: Coins,
  repair_shipped: Wrench,
  replacement_shipped: Package,
}

function Chip({ label, done, waiting }: { label: string; done: boolean; waiting: string }) {
  return (
    <span
      className={cn(
        'type-body-sm inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold transition-colors',
        done ? 'bg-emerald-50 text-emerald-700' : 'bg-sand-100 text-ink-600',
      )}
    >
      {done ? (
        <CircleCheck aria-hidden="true" className="size-4" />
      ) : (
        <Clock aria-hidden="true" className="size-4" />
      )}
      {label}: {done ? 'confirmed' : waiting}
    </span>
  )
}

/** S11 Return case (design/S11-return-case). Route /seller/returns/:id. */
export function ReturnCasePage() {
  const p = useReturnCase()
  const reduce = useReducedMotion()
  const { state, toOrder } = p

  useEffect(() => {
    if (state === 'not_a_case') toOrder()
  }, [state, toOrder])

  if (state === 'loading' || state === 'not_a_case')
    return (
      <SkeletonGroup label="Loading the case">
        <div className="grid gap-6 lg:grid-cols-12">
          <Skeleton className="h-64 w-full rounded-lg lg:col-span-7" />
          <Skeleton className="h-64 w-full rounded-lg lg:col-span-5" />
        </div>
      </SkeletonGroup>
    )
  if (state === 'not_yours')
    return (
      <>
        <h1 className="sr-only">Return case</h1>
        <div className="rounded-lg bg-surface shadow-1">
          <EmptyState
            illustration="vault"
            title="This order isn't in your shop"
            body="It may belong to another seller account."
            action={
              <Link to="/seller/returns" className="type-title text-primary">
                Back to returns
              </Link>
            }
          />
        </div>
      </>
    )
  if (state === 'error' || !p.order)
    return (
      <>
        <h1 className="sr-only">Return case</h1>
        <Banner
          tone="danger"
          title="We couldn't load this case."
          action={
            <Button variant="secondary" className="h-10" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      </>
    )

  const { order } = p
  const { panel } = order
  const offline = !p.online
  const primary = p.can.confirmReceived ? (
    <Button fullWidth disabled={offline} onClick={() => p.setDialog('received')}>
      I received the item
    </Button>
  ) : p.can.choose ? (
    <Button fullWidth disabled={offline || !p.choice || p.busy} loading={p.busy} onClick={p.confirmAction}>
      Confirm action
    </Button>
  ) : null

  const actionPanel = (
    <div className="flex flex-col gap-4 lg:sticky lg:top-24">
      <div aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={panel.title}
            aria-label="What to do now"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : duration.state }}
            className={cn('flex flex-col gap-4 rounded-lg p-5', TONE[panel.tone])}
          >
            <div className="flex items-start gap-4">
              {panel.tone === 'plum' && (
                <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-plum-700" />
              )}
              <div className="min-w-0 flex-1">
                <h2 className="type-title text-text">{panel.title}</h2>
                <p className="type-body-sm text-ink-600">{panel.body}</p>
              </div>
              {panel.deadline && (
                <CountdownRing
                  deadline={panel.deadline.at}
                  totalMs={panel.deadline.totalMs}
                  serverOffsetMs={order.serverOffsetMs}
                  label={panel.deadline.label}
                />
              )}
            </div>
            {panel.quote && (
              <blockquote className="type-body-sm rounded-md border-l-4 border-saffron-500 bg-surface px-4 py-3 text-ink-600 italic">
                "{panel.quote}"
              </blockquote>
            )}

            {p.can.choose && (
              <fieldset className="flex flex-col gap-3" disabled={offline || p.busy}>
                <legend className="sr-only">How will you resolve this?</legend>
                {order.options.map((option) => {
                  const Icon = OPTION_ICON[option.value] ?? Package
                  const selected = p.choice === option.value
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        'flex cursor-pointer items-start gap-3 rounded-md border bg-surface p-4',
                        'transition-[border-color,box-shadow] duration-(--duration-tap) ease-standard',
                        selected ? 'border-emerald-600 shadow-1' : 'border-border',
                        'has-focus-visible:ring-4 has-focus-visible:ring-emerald-100',
                      )}
                    >
                      <input
                        type="radio"
                        name="resolution"
                        value={option.value}
                        checked={selected}
                        onChange={() => p.setChoice(option.value)}
                        className="mt-1 size-5 accent-emerald-700"
                      />
                      <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-ink-600" />
                      <span className="flex flex-col gap-0.5">
                        <span className="type-body-md font-semibold text-text">{option.title}</span>
                        <span
                          className={cn(
                            'type-body-sm',
                            option.value === 'refund_issued' ? 'text-coral-600' : 'text-text-muted',
                          )}
                        >
                          {option.value === 'refund_issued'
                            ? `Sends KES ${order.amount.toLocaleString('en-KE')} back to the buyer now. This can't be undone.`
                            : option.description}
                        </span>
                      </span>
                    </label>
                  )
                })}
              </fieldset>
            )}
            {p.can.choose && p.choice && p.choice !== 'refund_issued' && (
              <TextArea
                label="Note for the buyer (optional)"
                placeholder="Courier, tracking number or what you fixed"
                value={p.note}
                maxLength={NOTE_MAX}
                onChange={(e) => p.setNote(e.target.value)}
              />
            )}
            {primary && <div className="hidden lg:block">{primary}</div>}
            {p.can.choose && !p.choice && (
              <p className="type-body-sm text-text-muted">Pick an option first.</p>
            )}
          </motion.section>
        </AnimatePresence>
      </div>

      {order.closure && (
        <Card className="flex flex-col gap-3">
          <h2 className="type-title text-text">Close the case</h2>
          <div className="flex flex-wrap gap-2">
            <Chip label="You" done={order.closure.you} waiting="not yet" />
            <Chip label="Buyer" done={order.closure.buyer} waiting="waiting" />
          </div>
          {p.can.confirmResolved && (
            <Button variant="secondary" disabled={offline || p.busy} onClick={() => void p.markResolved()}>
              Mark as resolved
            </Button>
          )}
          {order.closure.you && order.closure.buyer && (
            <p className="type-body-sm font-semibold text-emerald-700">Case closed.</p>
          )}
        </Card>
      )}

      {p.can.disagree && (
        <Button variant="secondary" disabled={offline} onClick={() => p.setDialog('disagree')}>
          I disagree with this account
        </Button>
      )}
    </div>
  )

  return (
    <div className={cn('flex flex-col gap-6', primary && 'pb-28 lg:pb-0')}>
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/seller/returns"
          className="type-body-md inline-flex min-h-11 items-center gap-1 font-semibold text-ink-600 hover:text-text"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Returns
        </Link>
        <h1 className="type-headline text-text">
          Return for <span className="font-mono">{order.reference}</span>
        </h1>
        <StatusPill status={order.status} />
      </div>

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      <div className={cn('grid items-start gap-6 lg:grid-cols-12', p.staleSince && 'opacity-70')}>
        <div className="flex flex-col gap-4 lg:order-2 lg:col-span-5">{actionPanel}</div>
        <div className="flex flex-col gap-4 lg:order-1 lg:col-span-7">
          <Card className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <p className="type-body-md font-semibold text-text">{order.title}</p>
              <MoneyText amount={order.amount} className="type-body-md font-semibold" />
            </div>
            <div>
              <p className="type-label mb-1 text-text-muted">Buyer's problem</p>
              {order.category && (
                <span className="type-body-sm rounded-full bg-coral-50 px-3 py-1 font-semibold text-coral-600">
                  {order.category}
                </span>
              )}
            </div>
            <blockquote className="type-body-sm rounded-md border-l-4 border-coral-500 bg-sand-100 px-4 py-3 text-ink-600 italic">
              "{order.description}"
            </blockquote>
            {order.buyerNotes && (
              <p className="type-body-sm text-ink-600">
                <span className="font-semibold">Buyer's latest note:</span> "{order.buyerNotes}"
              </p>
            )}
            <p className="type-body-sm text-text-muted">
              Reported <span className="font-mono tabular-nums">{order.reported}</span>
            </p>
          </Card>
          <Card className="flex flex-col gap-2">
            <h2 className="type-title text-text">Your policy</h2>
            <div className="flex flex-wrap gap-2">
              {order.policy.map((name) => (
                <span key={name} className="type-body-sm rounded-full bg-sand-100 px-3 py-1 text-ink-600">
                  {name}
                </span>
              ))}
            </div>
            <p className="type-body-sm text-text-muted">
              You promised these options when you listed the item.
            </p>
          </Card>
          <Card>
            <h2 className="type-title mb-3 text-text">Timeline</h2>
            <TimelinePanel orderId={order.id} />
          </Card>
          <p className="type-body-sm flex items-center gap-2 text-text-muted">
            <ShieldCheck aria-hidden="true" className="size-4 text-emerald-700" />
            Vekro cases never need photos. Describe what you see in words.
          </p>
        </div>
      </div>

      {primary && (
        <div className="lg:hidden">
          <ActionDock className="bottom-[calc(4rem+env(safe-area-inset-bottom))] pb-3">{primary}</ActionDock>
        </div>
      )}

      <ConfirmDialog
        open={p.dialog === 'received'}
        onOpenChange={(open) => !open && p.setDialog(null)}
        title="Did the item arrive?"
        body="Only confirm once you have it. You'll then choose how to resolve the case."
        confirmLabel="Yes, I have it"
        cancelLabel="Not yet"
        onConfirm={() => void p.confirmReceived()}
        loading={p.busy}
      />
      <ConfirmDialog
        open={p.dialog === 'refund'}
        onOpenChange={(open) => !open && p.setDialog(null)}
        destructive
        title={`Refund KES ${order.amount.toLocaleString('en-KE')} to the buyer?`}
        body="The money leaves escrow and goes back to the buyer's M-Pesa. You can't undo this."
        confirmLabel="Refund buyer"
        cancelLabel="Go back"
        onConfirm={() => void p.confirmRefund()}
        loading={p.busy}
      />
      <Sheet
        open={p.dialog === 'disagree'}
        onOpenChange={(open) => !open && p.setDialog(null)}
        title="Tell Vekro support what happened"
        description="Support reads both sides. The money stays in escrow until they decide."
        footer={
          <div className="flex flex-col gap-2">
            <Button fullWidth loading={p.busy} disabled={offline} onClick={() => void p.sendDisagreement()}>
              Send to Vekro support
            </Button>
            <Button variant="ghost" fullWidth onClick={() => p.setDialog(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <TextArea
          label="What's wrong with the buyer's account?"
          value={p.reason}
          maxLength={REASON_MAX}
          error={p.reasonError}
          onChange={(e) => p.setReason(e.target.value)}
        />
      </Sheet>
    </div>
  )
}
