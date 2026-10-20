import { Check, Info, PackageCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { useParams } from 'react-router'
import { useInspection } from '@/controllers/useInspection'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
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
      <PhotoViewer photos={page.photos} index={zoomed} title={order.title} onClose={() => setZoomed(null)} />
    </div>
  )
}
