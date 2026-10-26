import { ArrowLeft, CircleCheck, Clock, Info } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { useReturnFlow, type ReturnPanel } from '@/controllers/useReturnFlow'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { Stepper } from '../../components/domain/Stepper'
import { VaultCard } from '../../components/domain/VaultCard'
import { ActionDock } from '../../components/ui/ActionDock'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { TextArea } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

const TONE: Record<ReturnPanel['tone'], string> = {
  coral: 'bg-coral-50',
  lake: 'bg-lake-50',
  saffron: 'bg-saffron-50',
  emerald: 'bg-emerald-50',
  plum: 'bg-plum-50',
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

/** B6 Return flow (design/B6-return-flow). Route /order/:orderId/return. */
export function ReturnFlowPage() {
  const { orderId = '' } = useParams()
  const p = useReturnFlow(orderId)
  const reduce = useReducedMotion()
  const [note, setNote] = useState('')
  const { state, toTracker } = p

  useEffect(() => {
    if (state === 'not_a_return') toTracker()
  }, [state, toTracker])

  if (state === 'loading' || state === 'not_a_return')
    return (
      <SkeletonGroup label="Loading your return">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </SkeletonGroup>
    )
  if (state === 'not_found')
    return (
      <>
        <h1 className="sr-only">Your return</h1>
        <EmptyState
          illustration="parcel"
          title="We can't find this order"
          body="Check the link in your SMS, or log in with the phone you paid with."
        />
      </>
    )
  if (state === 'error' || !p.order)
    return (
      <>
        <h1 className="sr-only">Your return</h1>
        <Banner
          tone="danger"
          title="We couldn't load your return."
          action={
            <Button variant="secondary" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      </>
    )

  const { order } = p
  const { panel } = order
  const offline = !p.online
  const dock = p.can.sendBack ? (
    <Button fullWidth disabled={offline} onClick={() => p.setDialog('sent_back')}>
      I've sent it back
    </Button>
  ) : p.can.reconfirm ? (
    <>
      <Button fullWidth disabled={offline} onClick={() => p.setDialog('fixed')}>
        Yes, it's fixed
      </Button>
      <Button variant="danger" fullWidth disabled={offline} onClick={() => p.setDialog('not_fixed')}>
        No, still a problem
      </Button>
    </>
  ) : order.escalated ? (
    <Button variant="ghost" fullWidth onClick={p.help}>
      Get help
    </Button>
  ) : null

  return (
    <div className={cn('flex flex-col gap-4', dock ? 'pb-40' : 'pb-8')}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={p.back}
          aria-label="Back to your order"
          className="grid size-12 place-items-center rounded-full text-ink-600 hover:bg-sand-100"
        >
          <ArrowLeft aria-hidden="true" className="size-6" />
        </button>
        <h1 className="type-headline text-text">Your return</h1>
      </div>

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      <div className={cn('flex flex-col gap-4 transition-opacity', p.staleSince && 'opacity-70')}>
        <VaultCard
          reference={order.reference}
          amountLabel="Held in the vault"
          amount={order.amount}
          status={order.status}
          ring={order.ring}
        />
        <Card>
          <Stepper
            steps={['Reported', 'Sent back', 'Seller has it', 'Resolved']}
            current={order.step}
            label="Return progress"
          />
        </Card>

        <div aria-live="polite">
          <AnimatePresence mode="wait" initial={false}>
            <m.section
              key={panel.title}
              aria-label="Where your return stands"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: reduce ? 0 : duration.state }}
              className={cn('flex flex-col gap-3 rounded-lg p-5', TONE[panel.tone])}
            >
              <div className="flex items-start gap-4">
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
            </m.section>
          </AnimatePresence>
        </div>

        {order.sendingBack && (
          <Card className="flex gap-3">
            <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-lake-600" />
            <div>
              <h2 className="type-title text-text">Returning the item</h2>
              <p className="type-body-sm text-ink-600">
                Send it back the way it came, or arrange a drop-off with the seller. Keep your courier
                receipt.
              </p>
            </div>
          </Card>
        )}

        {order.closure && (
          <Card className="flex flex-col gap-3">
            <h2 className="type-title text-text">Close the case</h2>
            <div className="flex flex-wrap gap-2">
              <Chip label="You" done={order.closure.you} waiting="not yet" />
              <Chip label="Seller" done={order.closure.seller} waiting="waiting" />
            </div>
            {p.can.confirmResolved && (
              <Button variant="secondary" disabled={offline || p.busy} onClick={() => void p.markResolved()}>
                Mark as resolved
              </Button>
            )}
            {order.closure.you && order.closure.seller && (
              <p className="type-body-sm font-semibold text-emerald-700">Case closed.</p>
            )}
          </Card>
        )}

        {order.summary && (
          <Card className="flex flex-col gap-3">
            <h2 className="type-title text-text">Your report</h2>
            {order.summary.category && (
              <span className="type-body-sm w-fit rounded-full bg-coral-50 px-3 py-1 font-semibold text-coral-600">
                {order.summary.category}
              </span>
            )}
            <blockquote className="type-body-sm rounded-md border-l-4 border-coral-500 bg-sand-100 px-4 py-3 text-ink-600 italic">
              "{order.summary.description}"
            </blockquote>
            <p className="type-body-sm text-text-muted">
              Reported <span className="font-mono tabular-nums">{order.summary.reported}</span>
            </p>
          </Card>
        )}

        {order.policy && (
          <Card>
            <p className="type-body-md text-text">
              <span className="font-semibold">{order.sellerName} will:</span> {order.policy}
            </p>
            <p className="type-body-sm text-text-muted">They must follow this policy.</p>
          </Card>
        )}

        <p className="type-body-sm text-center">
          <Link to="/help" className="font-semibold text-primary">
            Get help
          </Link>
        </p>
      </div>

      {dock && <ActionDock>{dock}</ActionDock>}

      <ConfirmDialog
        open={p.dialog === 'sent_back'}
        onOpenChange={(open) => !open && p.setDialog(null)}
        title="Have you sent the item back?"
        body="The seller is told it's on the way and has about 3 days to confirm they got it."
        confirmLabel="Yes, it's on its way"
        cancelLabel="Not yet"
        onConfirm={() => void p.confirmSentBack()}
        loading={p.busy}
      />
      <ConfirmDialog
        open={p.dialog === 'fixed'}
        onOpenChange={(open) => !open && p.setDialog(null)}
        title="Confirm it's fixed?"
        body={`The seller is paid KES ${order.amount.toLocaleString('en-KE')} and the case closes.`}
        confirmLabel="Yes, it works"
        cancelLabel="Not yet"
        onConfirm={() => void p.confirmFixed()}
        loading={p.busy}
      />
      <Sheet
        open={p.dialog === 'not_fixed'}
        onOpenChange={(open) => !open && p.setDialog(null)}
        title={p.lastChance ? 'This will go to Vekro support' : 'Still not working?'}
        description={
          p.lastChance
            ? 'The seller has already tried once. Support will look at the case and decide.'
            : 'The seller gets one more chance to sort it out.'
        }
        footer={
          <div className="flex flex-col gap-2">
            <Button
              variant={p.lastChance ? 'destructive' : 'primary'}
              fullWidth
              loading={p.busy}
              disabled={offline}
              onClick={() => void p.confirmNotFixed(note)}
            >
              {p.lastChance ? 'Send to Vekro support' : 'Send it back to the seller'}
            </Button>
            <Button variant="ghost" fullWidth onClick={() => p.setDialog(null)}>
              Cancel
            </Button>
          </div>
        }
      >
        <TextArea
          label="What's still wrong? (optional)"
          value={note}
          maxLength={500}
          onChange={(e) => setNote(e.target.value)}
        />
      </Sheet>
    </div>
  )
}
