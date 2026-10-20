import { Check, Info, Lock, PackageCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { useInspection } from '@/controllers/useInspection'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { spring } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { MoneyPath } from '../../components/domain/MoneyPath'
import { VaultCard } from '../../components/domain/VaultCard'
import { ActionDock } from '../../components/ui/ActionDock'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { RadioCardGroup } from '../../components/ui/Choice'
import { TextArea } from '../../components/ui/Field'
import { Sheet } from '../../components/ui/Sheet'
import { CodeCells } from '../../components/ui/CodeCells'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { PhotoViewer } from '../../components/ui/PhotoViewer'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

function Checklist({
  items,
  onToggle,
}: {
  items: { label: string; checked: boolean }[]
  onToggle: (i: number) => void
}) {
  const reduce = useReducedMotion()
  const done = items.filter((item) => item.checked).length
  return (
    <Card padded={false}>
      <ul aria-label="Inspection checklist" className="divide-y divide-border">
        {items.map((item, i) => (
          <li key={item.label}>
            <label className="flex min-h-14 cursor-pointer items-center gap-3 px-5 py-3">
              <input
                type="checkbox"
                checked={item.checked}
                onChange={() => onToggle(i)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={cn(
                  'grid size-6 shrink-0 place-items-center rounded-sm border-2 transition-colors peer-focus-visible:ring-4 peer-focus-visible:ring-emerald-200',
                  item.checked
                    ? 'border-emerald-600 bg-emerald-600 text-sand-0'
                    : 'border-sand-300 bg-surface',
                )}
              >
                {item.checked && (
                  <motion.span
                    initial={reduce ? false : { scale: 0.4 }}
                    animate={{ scale: 1 }}
                    transition={spring}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </motion.span>
                )}
              </span>
              <span className="type-body-md text-text">{item.label}</span>
            </label>
          </li>
        ))}
      </ul>
      <p className="type-body-sm border-t border-border px-5 py-3 text-text-muted" aria-live="polite">
        {done} of {items.length} checked
      </p>
    </Card>
  )
}

/** B4 Arrival, inspection and decision (design/B4-inspection). Route /order/:orderId/inspect. */
export function InspectionPage() {
  const { orderId = '' } = useParams()
  const page = useInspection(orderId)
  const [zoomed, setZoomed] = useState<number | null>(null)

  if (page.state === 'loading')
    return (
      <SkeletonGroup label="Loading your order">
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-56 w-full rounded-lg" />
      </SkeletonGroup>
    )
  if (page.state === 'not_found')
    return (
      <EmptyState
        illustration="parcel"
        title="We can't find this order"
        body="Check the link in your SMS, or log in with the phone you paid with."
      />
    )
  if (page.state === 'error' || !page.order || !page.variant)
    return (
      <Banner
        tone="danger"
        title={page.online ? "We couldn't load your order." : "You're offline."}
        action={
          <Button variant="secondary" onClick={page.retry}>
            Try again
          </Button>
        }
      />
    )

  const { order } = page

  if (page.variant === 'done')
    return (
      <div className="flex flex-col gap-5">
        <VaultCard
          reference={order.reference}
          amountLabel="Paid to the seller"
          amount={order.amount}
          status={{ label: 'Complete, seller paid', tone: 'emerald', icon: 'check' }}
          ring="released"
        />
        <div aria-live="polite">
          <h1 className="type-headline text-text">All done</h1>
          <p className="type-body-md text-ink-600">
            You accepted the item. {order.sellerName} has been paid.
          </p>
        </div>
        <MoneyPath
          buyer={{ title: 'You' }}
          vault={{ title: 'Vekro vault' }}
          seller={{ title: order.sellerName }}
          position="seller"
        />
        <ActionDock>
          <Button fullWidth onClick={page.trackOrder}>
            Track my order
          </Button>
        </ActionDock>
      </div>
    )

  if (page.variant === 'hold')
    return (
      <div className="flex flex-col gap-5">
        <VaultCard
          reference={order.reference}
          amountLabel="Held for 24 hours"
          amount={order.amount}
          status={{ label: 'Held 24 hours for checks', tone: 'saffron', icon: 'hourglass' }}
          ring="draining"
        />
        <div aria-live="polite" className="flex items-center gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="type-headline text-text">Held for 24 hours. Test your item.</h1>
            <p className="type-body-md text-ink-600">
              If something doesn&apos;t work, report it before the timer ends.
            </p>
          </div>
          {page.holdDeadline && (
            <CountdownRing
              deadline={page.holdDeadline.at}
              totalMs={page.holdDeadline.totalMs}
              serverOffsetMs={order.serverOffsetMs}
              label="Time left to report"
            />
          )}
        </div>
        {page.acceptedProblems.length > 0 && (
          <Card>
            <p className="type-body-sm font-semibold text-text">You can report</p>
            <ul className="type-body-md mt-2 flex list-disc flex-col gap-1 pl-5 text-ink-600">
              {page.acceptedProblems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </Card>
        )}
        <ActionDock>
          <Button variant="danger" fullWidth onClick={page.reportProblem}>
            Report a problem
          </Button>
          <Button variant="ghost" fullWidth onClick={page.trackOrder}>
            Everything works
          </Button>
        </ActionDock>
      </div>
    )

  if (page.variant === 'rejected' || page.variant === 'timed_out')
    return (
      <div className="flex flex-col gap-5">
        <VaultCard
          reference={order.reference}
          amountLabel="Coming back to you"
          amount={order.amount}
          status={{ label: 'Returned to seller', tone: 'coral', icon: 'undo' }}
          ring="returned"
        />
        <div
          aria-live="polite"
          className={cn('rounded-lg p-5', page.variant === 'timed_out' ? 'bg-coral-50' : 'bg-surface')}
        >
          <h1 className="type-headline text-text">
            {page.variant === 'rejected' ? 'The item is going back to the seller' : 'Time ran out'}
          </h1>
          <p className="type-body-md text-ink-600">
            {page.variant === 'rejected'
              ? `Your refund of ${formatKes(order.amount)} is on its way to ${page.phoneMasked ?? 'your M-Pesa number'}.`
              : "The item goes back to the seller and you're refunded."}
          </p>
        </div>
        <MoneyPath
          buyer={{ title: 'You' }}
          vault={{ title: 'Vekro vault' }}
          seller={{ title: order.sellerName }}
          position="buyer"
        />
        <ActionDock>
          <Button fullWidth onClick={page.trackOrder}>
            Track my order
          </Button>
        </ActionDock>
      </div>
    )

  if (page.variant !== 'inspect')
    return (
      <Card className="mt-4">
        <EmptyState
          illustration="parcel"
          title={page.variant === 'not_yet' ? "Your item isn't at your door yet" : 'Inspection is over'}
          body={
            page.variant === 'not_yet'
              ? "When the courier arrives, the seller marks it and you'll get a text with your code."
              : 'Your order page shows what happens next.'
          }
          action={<Button onClick={page.trackOrder}>Track my order</Button>}
        />
      </Card>
    )

  const accepting = order.isSerialized
    ? 'Payment is held for 24 hours; you can report a functional issue in that window.'
    : 'Accepting is final and releases payment to the seller.'

  return (
    <div className="flex flex-col gap-5">
      {page.deadline && (
        <div className="flex items-center justify-end gap-3">
          <CountdownRing
            deadline={page.deadline.at}
            totalMs={page.deadline.totalMs}
            serverOffsetMs={order.serverOffsetMs}
            label="Time left to inspect"
            announceAt={[600, 60]}
          />
          <span className="type-body-sm font-semibold text-saffron-700">left to inspect</span>
        </div>
      )}
      {!page.online && (
        <Banner tone="warning" title="You're offline.">
          You can still check the item. Connect to accept or reject.
        </Banner>
      )}
      <section className="flex gap-3 rounded-lg bg-saffron-50 p-5">
        <PackageCheck aria-hidden="true" className="size-6 shrink-0 text-saffron-700" />
        <div>
          <h2 className="type-title text-text">Your item has arrived</h2>
          <p className="type-body-sm text-ink-600">
            Check it before you decide. If you do nothing, the item goes back to the seller and you&apos;re
            refunded when the timer ends.
          </p>
        </div>
      </section>
      <h1 className="type-display-lg text-text">Inspect before you confirm</h1>
      <Checklist items={page.checklist} onToggle={page.toggleCheck} />
      {page.photos.length > 0 && (
        <div className="flex flex-col gap-2">
          <p className="type-body-sm font-semibold text-text">Compare with the seller&apos;s photos</p>
          <div className="flex gap-2">
            {page.photos.slice(0, 3).map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setZoomed(i)}
                aria-label={`Seller photo ${i + 1} of ${page.photos.length}`}
                className="size-18 overflow-hidden rounded-md border border-border focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:outline-none"
              >
                <img src={url} alt="" className="size-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex gap-3 rounded-md bg-surface-sunken p-4">
        <Info aria-hidden="true" className="size-5 shrink-0 text-ink-600" />
        <p className="type-body-md text-ink-600">{accepting}</p>
      </div>
      <Card className="flex flex-col gap-4">
        <div>
          <p className="type-label text-text-muted">Delivery code</p>
          <h2 className="type-title text-text">Enter the code we sent you</h2>
          <p className="type-body-sm text-ink-600">
            We sent a 6-digit code to {page.phoneMasked ?? 'your phone'} by SMS and in your Vekro
            notifications. Only enter it once you&apos;re happy with the item.
          </p>
        </div>
        <CodeCells label="Delivery code" value={page.code} onChange={page.setCode} error={page.codeError} />
        <button
          type="button"
          onClick={page.toggleHelp}
          aria-expanded={page.helpOpen}
          className="type-body-sm min-h-12 self-start font-semibold text-primary"
        >
          Didn&apos;t get the code?
        </button>
        {page.helpOpen && (
          <p className="type-body-sm text-ink-600">
            Codes arrive within a minute. Check your SMS inbox and notifications. Still nothing? Get help.
          </p>
        )}
      </Card>
      <ActionDock>
        <Button fullWidth disabled={!page.canAccept} onClick={() => page.setConfirmOpen(true)}>
          <Lock aria-hidden="true" className="size-5" />
          Accept item
        </Button>
        <Button variant="danger" fullWidth disabled={!page.online} onClick={() => page.setRejectOpen(true)}>
          Item isn&apos;t right, reject
        </Button>
        {!page.online && <p className="type-body-sm text-center text-coral-600">You&apos;re offline</p>}
      </ActionDock>
      <Sheet
        open={page.rejectOpen}
        onOpenChange={page.setRejectOpen}
        title="What's wrong?"
        description="The item goes back to the seller and you're refunded. Your code stays unused."
        footer={
          <>
            <Button
              variant="destructive"
              onClick={page.reject}
              loading={page.rejecting}
              disabled={!page.reason}
            >
              Confirm rejection
            </Button>
            <Button variant="ghost" onClick={() => page.setRejectOpen(false)}>
              Go back
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <RadioCardGroup
            legend="Reason"
            name="reject-reason"
            options={page.reasons.map((r) => ({ value: r.value, title: r.label }))}
            value={page.reason}
            onChange={page.setReason}
          />
          <TextArea
            label="Tell the seller what's wrong (optional)"
            maxLength={500}
            value={page.note}
            onChange={(e) => page.setNote(e.target.value)}
          />
          {page.rejectError && <Banner tone="danger" title={page.rejectError} />}
        </div>
      </Sheet>
      <ConfirmDialog
        open={page.confirmOpen}
        onOpenChange={page.setConfirmOpen}
        title="Accept this item?"
        body={page.confirmBody}
        confirmLabel="Yes, accept"
        cancelLabel="Not yet"
        onConfirm={page.accept}
        loading={page.accepting}
      />
      <PhotoViewer photos={page.photos} index={zoomed} title={order.title} onClose={() => setZoomed(null)} />
    </div>
  )
}
