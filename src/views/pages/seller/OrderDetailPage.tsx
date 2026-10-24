import {
  ArrowLeft,
  CircleAlert,
  CircleCheck,
  Clock,
  Coins,
  Copy,
  Eye,
  Hourglass,
  Link2,
  LoaderCircle,
  Lock,
  Package,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { useSellerOrder, type ActionPanel, type PayoutLine } from '@/controllers/useSellerOrder'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { MoneyPath } from '../../components/domain/MoneyPath'
import { StatusPill } from '../../components/domain/StatusPill'
import { VaultCard } from '../../components/domain/VaultCard'
import { ActionDock } from '../../components/ui/ActionDock'
import { ActionsMenu } from '../../components/ui/ActionsMenu'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { EmptyState } from '../../components/ui/EmptyState'
import { MoneyText } from '../../components/ui/MoneyText'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { Tabs } from '../../components/ui/Tabs'
import { TimelinePanel } from '../buyer/timeline/TimelinePanel'
import { TransitionDialog } from './orders/TransitionDialog'

const PANEL_TONE: Record<ActionPanel['tone'], { box: string; icon: string }> = {
  sand: { box: 'bg-sand-100', icon: 'text-ink-600' },
  emerald: { box: 'bg-emerald-50', icon: 'text-emerald-700' },
  saffron: { box: 'bg-saffron-50', icon: 'text-saffron-700' },
  coral: { box: 'bg-coral-50', icon: 'text-coral-600' },
  plum: { box: 'bg-plum-50', icon: 'text-plum-700' },
  lake: { box: 'bg-lake-50', icon: 'text-lake-600' },
}
const PANEL_ICON: Record<ActionPanel['icon'], LucideIcon> = {
  clock: Clock,
  lock: Lock,
  truck: Truck,
  eye: Eye,
  hourglass: Hourglass,
  alert: CircleAlert,
  shield: ShieldCheck,
  check: CircleCheck,
  closed: Coins,
}
const LINE_ICON: Record<PayoutLine['icon'], LucideIcon> = {
  lock: Lock,
  check: CircleCheck,
  loader: LoaderCircle,
  alert: CircleAlert,
  coin: Coins,
  clock: Clock,
}
const LINE_TONE: Record<PayoutLine['tone'], string> = {
  emerald: 'text-emerald-700',
  lake: 'text-lake-600',
  coral: 'text-coral-600',
  sand: 'text-ink-600',
}

/** S6 Order detail (design/S6-order-detail). Route /seller/orders/:id. */
export function OrderDetailPage() {
  const p = useSellerOrder()
  const navigate = useNavigate()
  const reduce = useReducedMotion()
  const [tab, setTab] = useState('overview')

  if (p.state === 'loading')
    return (
      <SkeletonGroup label="Loading the order">
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="flex flex-col gap-4 lg:col-span-8">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-28 w-full rounded-lg" />
          </div>
          <Skeleton className="h-72 w-full rounded-lg lg:col-span-4" />
        </div>
      </SkeletonGroup>
    )
  if (p.state === 'not_yours' || (p.state === 'ready' && !p.order))
    return (
      <>
        <h1 className="sr-only">Order detail</h1>
        <div className="rounded-lg bg-surface shadow-1">
          <EmptyState
            illustration="vault"
            title="This order isn't in your shop"
            body="It may belong to another seller account."
            action={
              <Link to="/seller/orders" className="type-title text-primary">
                Back to orders
              </Link>
            }
          />
        </div>
      </>
    )
  if (p.state === 'error' || !p.order)
    return (
      <>
        <h1 className="sr-only">Order detail</h1>
        <Banner
          tone="danger"
          title="We couldn't load this order."
          action={
            <Button variant="secondary" className="h-10" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      </>
    )

  const { order } = p
  const { panel, payout } = order
  const action = panel.action
  const offline = !p.online
  const actionButton = (full: boolean) =>
    action &&
    (action.kind === 'open_case' ? (
      <Button
        variant={action.secondary ? 'secondary' : 'primary'}
        fullWidth={full}
        onClick={() => navigate(action.to)}
      >
        {action.label}
      </Button>
    ) : (
      <Button
        fullWidth={full}
        disabled={offline}
        title={offline ? "You're offline" : undefined}
        onClick={() => p.runAction(action)}
      >
        {action.label}
      </Button>
    ))
  const tone = PANEL_TONE[panel.tone]
  const PanelIcon = PANEL_ICON[panel.icon]
  const LineIcon = LINE_ICON[payout.line.icon]

  const overview = (
    <div className={cn('flex flex-col gap-4 transition-opacity', p.staleSince && 'opacity-70')}>
      <VaultCard
        reference={order.reference}
        amountLabel={order.amountLabel}
        amount={order.amount}
        status={order.status}
        ring={order.ring}
      />
      <Card>
        <MoneyPath
          buyer={{ title: 'Buyer', detail: order.buyer.name }}
          vault={{ title: 'Vekro vault' }}
          seller={{ title: 'You' }}
          position={order.moneyAt}
        />
      </Card>

      <div aria-live="polite">
        <AnimatePresence mode="wait" initial={false}>
          <motion.section
            key={panel.title}
            aria-label="What to do now"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduce ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: reduce ? 0 : duration.state }}
            className={cn('flex flex-col gap-4 rounded-lg p-5', tone.box)}
          >
            <div className="flex items-start gap-4">
              <PanelIcon aria-hidden="true" className={cn('size-6 shrink-0', tone.icon)} />
              <div className="min-w-0 flex-1">
                <h2 className="type-title text-text">{panel.title}</h2>
                <p className="type-body-sm text-ink-600">
                  {panel.body}
                  {panel.deadline?.approximate && ' Times are approximate.'}
                </p>
                {panel.warning && (
                  <p className="type-body-sm mt-2 font-semibold text-saffron-700">{panel.warning}</p>
                )}
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
            {action && <div className="hidden lg:block">{actionButton(false)}</div>}
          </motion.section>
        </AnimatePresence>
      </div>

      {order.simulated && (
        <p className="type-body-sm rounded-md bg-lake-50 px-4 py-3 text-lake-600">
          Demo order: Vekro is in test mode, so no real money moves.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4">
          <span className="grid size-14 shrink-0 place-items-center rounded-md bg-sand-100 text-ink-400">
            <Package aria-hidden="true" className="size-6" />
          </span>
          <div className="min-w-0">
            <p className="type-body-md truncate font-semibold text-text">{order.item.title}</p>
            <p className="type-body-sm text-text-muted">
              <MoneyText amount={order.item.price} /> ·{' '}
              {order.item.isSerialized ? 'Serialized, IMEI on file' : 'Standard item'}
            </p>
            <Link
              to={`/seller/listings/${order.item.listingId}`}
              className="type-body-sm inline-flex min-h-11 items-center font-semibold text-primary"
            >
              View listing
            </Link>
          </div>
        </Card>
        <Card className="flex flex-col justify-center gap-1">
          <p className="type-label text-text-muted">Buyer</p>
          <p className="type-body-md font-semibold text-text">{order.buyer.name}</p>
          {order.buyer.phoneMasked && (
            <p className="type-body-sm text-text-muted">{order.buyer.phoneMasked}</p>
          )}
        </Card>
      </div>
    </div>
  )

  const payoutCard = (
    <Card className="flex flex-col gap-4 lg:sticky lg:top-24">
      <h2 className="type-title text-text">Your payout</h2>
      <dl className="type-body-md flex flex-col gap-2">
        <div className="flex justify-between">
          <dt className="text-text-muted">Order amount</dt>
          <dd>
            <MoneyText amount={payout.gross} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Network fee (estimated)</dt>
          <dd>
            −<MoneyText amount={payout.fee} />
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-text-muted">Platform fee</dt>
          <dd>
            <MoneyText amount={0} />
          </dd>
        </div>
        <div className="mt-1 flex items-baseline justify-between border-t border-border pt-3">
          <dt className="font-semibold text-text">You receive</dt>
          <dd className="type-headline text-text">
            <MoneyText amount={payout.net} />
          </dd>
        </div>
      </dl>
      <p className={cn('type-body-sm flex items-start gap-2 font-semibold', LINE_TONE[payout.line.tone])}>
        <LineIcon aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          {payout.line.text}
          {payout.line.reference && (
            <>
              {' '}
              · <span className="type-mono">{payout.line.reference}</span>
            </>
          )}
          {payout.line.when && <span className="block font-normal text-text-muted">{payout.line.when}</span>}
        </span>
      </p>
      <p className="type-body-sm text-text-muted">
        Vekro holds the money in escrow for this one order. It moves to your M-Pesa only after the buyer
        accepts the item, or when a timer runs out in your favour.
      </p>
    </Card>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/seller/orders"
          className="type-body-md inline-flex min-h-11 items-center gap-1 font-semibold text-ink-600 hover:text-text"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Orders
        </Link>
        <h1 className="type-headline flex items-center gap-1 font-mono text-text">
          {order.reference}
          <button
            type="button"
            onClick={() => void p.copyReference()}
            aria-label="Copy order reference"
            className="grid size-11 place-items-center rounded-full text-ink-600 hover:bg-sand-100"
          >
            <Copy aria-hidden="true" className="size-4" />
          </button>
        </h1>
        <StatusPill status={order.status} />
        <div className="ml-auto">
          <ActionsMenu
            label="Order options"
            actions={[
              { label: 'Copy order link', Icon: Link2, onSelect: () => void p.copyLink() },
              { label: 'Get help', Icon: ShieldCheck, onSelect: () => navigate('/help') },
            ]}
          />
        </div>
      </div>

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-12">
        <div className="min-w-0 lg:col-span-8">
          <Tabs
            label="Order views"
            value={tab}
            onValueChange={setTab}
            items={[
              { value: 'overview', label: 'Overview', content: overview },
              { value: 'timeline', label: 'Timeline', content: <TimelinePanel orderId={order.id} /> },
            ]}
          />
        </div>
        <div className="lg:col-span-4">{payoutCard}</div>
      </div>

      {action && (
        <div className="h-20 lg:hidden">
          {/* Sits on top of the seller bottom navigation (64px plus the safe area). */}
          <ActionDock className="bottom-[calc(4rem+env(safe-area-inset-bottom))] pb-3">
            {actionButton(true)}
          </ActionDock>
        </div>
      )}

      <TransitionDialog
        pending={p.transition.pending}
        running={p.transition.running}
        onConfirm={() => void p.transition.confirm()}
        onCancel={p.transition.cancel}
      />
    </div>
  )
}
