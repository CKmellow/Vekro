import {
  CircleAlert,
  Clock,
  Copy,
  Eye,
  Hourglass,
  Link2,
  Lock,
  Package,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useOrderTracker, type NextStep } from '@/controllers/useOrderTracker'
import { cn } from '@/lib/cn'
import { MoneyPath } from '../../components/domain/MoneyPath'
import { Stepper } from '../../components/domain/Stepper'
import { VaultCard } from '../../components/domain/VaultCard'
import { ActionsMenu } from '../../components/ui/ActionsMenu'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { MoneyText } from '../../components/ui/MoneyText'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

const TONES: Record<NextStep['tone'], { box: string; icon: string }> = {
  emerald: { box: 'bg-emerald-50', icon: 'text-emerald-700' },
  saffron: { box: 'bg-saffron-50', icon: 'text-saffron-700' },
  coral: { box: 'bg-coral-50', icon: 'text-coral-600' },
  plum: { box: 'bg-plum-50', icon: 'text-plum-700' },
  lake: { box: 'bg-lake-50', icon: 'text-lake-600' },
}
const ICONS = { emerald: Lock, saffron: Clock, coral: CircleAlert, plum: ShieldCheck, lake: Truck }

function NextStepCard({ step }: { step: NextStep }) {
  const { box, icon } = TONES[step.tone]
  const Icon =
    step.title === 'Your item has arrived'
      ? Eye
      : step.title.startsWith('Funds held')
        ? Hourglass
        : ICONS[step.tone]
  return (
    <section aria-label="Next step" className={cn('flex items-center gap-4 rounded-lg p-5', box)}>
      <Icon aria-hidden="true" className={cn('size-6 shrink-0 self-start', icon)} />
      <div className="min-w-0 flex-1">
        <h2 className="type-title text-text">{step.title}</h2>
        <p className="type-body-sm text-ink-600">{step.body}</p>
      </div>
    </section>
  )
}

/** B3 Order tracker (design/B3-order-tracker). Route /order/:orderId. */
export function OrderTrackerPage() {
  const { orderId = '' } = useParams()
  const page = useOrderTracker(orderId)

  if (page.state === 'loading')
    return (
      <SkeletonGroup label="Loading your order">
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-20 w-full rounded-lg" />
      </SkeletonGroup>
    )
  if (page.state === 'not_found' || (page.state === 'ready' && !page.order))
    return (
      <EmptyState
        illustration="parcel"
        title="We can't find this order"
        body="Check the link in your SMS, or log in with the phone you paid with."
        action={
          <Link
            to={`/login?returnTo=${encodeURIComponent(`/order/${orderId}`)}`}
            className="type-title text-primary"
          >
            Log in
          </Link>
        }
      />
    )
  if (page.state === 'error' || !page.order)
    return (
      <Banner
        tone="danger"
        title="We couldn't load your order."
        action={
          <Button variant="secondary" onClick={page.retry}>
            Try again
          </Button>
        }
      />
    )

  const { order } = page
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="type-headline text-text">Your order</h1>
        <ActionsMenu
          label="Order options"
          actions={[
            { label: 'Copy link', Icon: Link2, onSelect: () => void page.copyLink() },
            { label: 'Get help', Icon: ShieldCheck, onSelect: () => page.go('/help') },
          ]}
        />
      </div>
      {page.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{page.staleSince}</span>.
        </Banner>
      )}
      <div className={cn('flex flex-col gap-4 transition-opacity', page.staleSince && 'opacity-70')}>
        <VaultCard
          reference={order.reference}
          amountLabel={order.amountLabel}
          amount={order.amount}
          status={order.status}
          ring={order.ring}
        />
        <p className="type-body-sm -mt-2 flex items-center justify-end gap-1 text-text-muted">
          Order reference <span className="type-mono text-text">{order.reference}</span>
          <button
            type="button"
            onClick={() => void page.copyReference()}
            aria-label="Copy order reference"
            className="grid size-12 place-items-center rounded-full text-ink-600 hover:bg-sand-100"
          >
            <Copy aria-hidden="true" className="size-4" />
          </button>
        </p>
        <Card>
          <MoneyPath
            buyer={{ title: 'You' }}
            vault={{ title: 'Vekro vault' }}
            seller={{ title: order.sellerName }}
            position={order.moneyAt}
          />
        </Card>
        <div aria-live="polite">
          <NextStepCard step={order.next} />
        </div>
        {order.simulated && (
          <p className="type-body-sm rounded-md bg-lake-50 px-4 py-3 text-lake-600">
            Demo order: Vekro is in test mode, so no real money moves.
          </p>
        )}
        <Card className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-md bg-sand-100 text-ink-400">
            <Package aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="type-body-md truncate font-semibold text-text">{order.title}</p>
            <p className="type-body-sm text-text-muted">
              <MoneyText amount={order.price} /> · {order.sellerName}
            </p>
          </div>
        </Card>
        {order.progress && (
          <Card>
            <Stepper steps={order.progress.steps} current={order.progress.current} label="Order progress" />
          </Card>
        )}
        <p className="type-body-sm text-center">
          <Link to="/help" className="font-semibold text-primary">
            Get help
          </Link>
        </p>
      </div>
    </div>
  )
}
