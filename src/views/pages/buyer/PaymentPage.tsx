import { ChevronDown, Copy, ExternalLink, X } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router'
import { usePaymentPage, type PaymentVariant } from '@/controllers/usePaymentPage'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import type { LockRingState, StatusView } from '@/lib/status'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { MoneyPath } from '../../components/domain/MoneyPath'
import { VaultCard } from '../../components/domain/VaultCard'
import { ActionDock } from '../../components/ui/ActionDock'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

const FAILURES: Record<Extract<PaymentVariant, { kind: 'failed' }>['reason'], [string, string]> = {
  cancelled: ['You cancelled the M-Pesa request.', 'Nothing was charged.'],
  wrong_pin: ['The PIN was incorrect.', 'Nothing was charged. Try again and enter your M-Pesa PIN.'],
  insufficient_funds: ["There wasn't enough in M-Pesa.", 'Top up M-Pesa and try again.'],
  timeout: ['The M-Pesa request expired.', 'Nothing was charged. Send a new request to try again.'],
  provider_error: ["M-Pesa didn't go through.", "This is on M-Pesa's side. Try again in a minute."],
}

/** "Resend prompt (0:18)" while the server cooldown runs. */
const withWait = (label: string, seconds: number) =>
  seconds > 0 ? `${label} (${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')})` : label

const NOT_THROUGH: StatusView = { label: "Payment didn't go through", tone: 'coral', icon: 'alert' }

/** Geometric phone with the prompt on screen; floats gently (still under reduced motion). */
function PhoneIllustration({ amount }: { amount: string }) {
  const reduce = useReducedMotion()
  return (
    <m.svg
      aria-hidden="true"
      viewBox="0 0 120 180"
      className="mx-auto h-36 w-24"
      animate={reduce ? undefined : { y: [0, -4, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="6" y="4" width="108" height="172" rx="18" className="fill-ink-950" />
      <rect x="14" y="16" width="92" height="148" rx="10" className="fill-sand-50" />
      <rect
        x="22"
        y="48"
        width="76"
        height="70"
        rx="8"
        className="fill-surface stroke-emerald-200"
        strokeWidth="1.5"
      />
      <text x="60" y="72" textAnchor="middle" className="fill-ink-950 font-mono text-[9px] font-bold">
        {amount}
      </text>
      {[0, 1, 2, 3].map((i) => (
        <circle key={i} cx={42 + i * 12} cy="94" r="3.5" className="fill-emerald-600" />
      ))}
      <rect x="44" y="134" width="32" height="10" rx="5" className="fill-emerald-700" />
    </m.svg>
  )
}

function Tips({ amount }: { amount: string }) {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="type-body-md flex min-h-12 w-full items-center justify-between font-semibold text-text"
      >
        Didn&apos;t get the prompt?
        <ChevronDown aria-hidden="true" className={cn('size-5 transition-transform', open && 'rotate-180')} />
      </button>
      {open && (
        <ul className="type-body-sm mt-2 flex list-disc flex-col gap-1 pl-5 text-ink-600">
          <li>Your phone is on and has network.</li>
          <li>You have at least {amount} in M-Pesa.</li>
          <li>If you use the SIM toolkit, open M-Pesa and check for a pending request.</li>
        </ul>
      )}
    </Card>
  )
}

/** B2 Payment (design/B2-payment). Route /order/:orderId/payment. */
export function PaymentPage() {
  const { orderId = '' } = useParams()
  const page = usePaymentPage(orderId)
  const successHeading = useRef<HTMLHeadingElement>(null)
  const kind = page.variant?.kind
  useEffect(() => {
    if (kind === 'success') successHeading.current?.focus()
  }, [kind])

  const header = (
    <div className="flex items-center justify-between gap-3">
      <h1 className="type-display-lg text-text">Complete payment</h1>
      <button
        type="button"
        onClick={() => page.setLeaveOpen(true)}
        aria-label="Leave payment"
        className="grid size-12 shrink-0 place-items-center rounded-full text-ink-600 hover:bg-sand-100"
      >
        <X aria-hidden="true" className="size-6" />
      </button>
    </div>
  )

  if (page.state === 'loading')
    return (
      <SkeletonGroup label="Loading your payment">
        <Skeleton className="h-12 w-3/4" />
        <Skeleton className="h-44 w-full rounded-xl" />
        <Skeleton className="h-20 w-full" />
      </SkeletonGroup>
    )
  if (page.state === 'not_found')
    return (
      <EmptyState
        illustration="link"
        title="We can't find this payment"
        body="Open the link the seller sent you to start again."
      />
    )
  if (page.state === 'error' || !page.order || !page.variant)
    return (
      <Banner
        tone="danger"
        title={page.online ? "We couldn't load your payment" : "You're offline"}
        action={
          <Button variant="secondary" onClick={page.retry}>
            Try again
          </Button>
        }
      >
        Nothing changes while this page is closed. If you entered your PIN, the payment still goes through.
      </Banner>
    )

  const { order, variant } = page
  const amount = formatKes(order.amount)
  const failed = variant.kind === 'failed' || variant.kind === 'not_started' || variant.kind === 'timed_out'
  const ring: LockRingState = variant.kind === 'success' ? 'locked' : 'open'
  const failure =
    variant.kind === 'failed'
      ? FAILURES[variant.reason]
      : variant.kind === 'timed_out'
        ? FAILURES.timeout
        : variant.kind === 'not_started'
          ? ([
              "We couldn't send the M-Pesa request.",
              'Nothing was charged. Send a new request to try again.',
            ] as const)
          : null

  return (
    <div className="flex flex-col gap-5">
      {header}
      {!page.online && (
        <Banner tone="warning" title="You're offline.">
          We&apos;ll check your payment when you&apos;re back.
        </Banner>
      )}
      <div className="flex flex-col gap-2">
        <VaultCard
          reference={order.reference}
          amountLabel={variant.kind === 'success' ? 'Held safely' : "You're paying"}
          amount={order.amount}
          status={failed ? NOT_THROUGH : order.status}
          ring={ring}
          hint={
            variant.kind === 'success'
              ? 'Held until you confirm delivery'
              : 'Your money goes into the Vekro vault, not to the seller.'
          }
        />
        <p className="type-body-sm flex items-center justify-end gap-1 text-text-muted">
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
      </div>
      {order.simulated && (
        <p className="type-body-sm rounded-md bg-lake-50 px-4 py-3 text-lake-600">
          Demo payment: Vekro is in test mode, so no real money moves.
        </p>
      )}

      <div aria-live="polite" className="flex flex-col gap-5">
        {variant.kind === 'success' && (
          <>
            <div>
              <h2 ref={successHeading} tabIndex={-1} className="type-headline text-text focus:outline-none">
                Payment received
              </h2>
              <p className="type-body-md text-ink-600">{amount} is held safely until you confirm delivery.</p>
            </div>
            <MoneyPath
              buyer={{ title: 'You' }}
              vault={{ title: 'Vekro vault', detail: 'Held safely' }}
              seller={{ title: order.sellerName }}
              position="vault"
            />
          </>
        )}

        {variant.kind === 'waiting' && (
          <>
            <div>
              <h2 className="type-headline text-text">Check your phone and enter your M-Pesa PIN</h2>
              <p className="type-body-md text-ink-600">
                We sent a payment request for {amount}
                {order.phoneMasked ? (
                  <>
                    {' '}
                    to <span className="type-mono">{order.phoneMasked}</span>
                  </>
                ) : null}
                .
              </p>
            </div>
            <PhoneIllustration amount={amount} />
            {variant.expiresAt && variant.sentAt && (
              <div className="flex items-center gap-3">
                <CountdownRing
                  deadline={variant.expiresAt}
                  totalMs={new Date(variant.expiresAt).getTime() - new Date(variant.sentAt).getTime()}
                  serverOffsetMs={order.serverOffsetMs}
                  label="Time left to approve"
                  announceAt={[60, 10]}
                />
                <span className="type-body-md text-ink-600">left to approve</span>
              </div>
            )}
            <Tips amount={amount} />
          </>
        )}

        {variant.kind === 'redirect' && (
          <div>
            <h2 className="type-headline text-text">Continue to secure checkout</h2>
            <p className="type-body-md text-ink-600">
              You&apos;ll pay {amount} on a secure page, then come back here automatically.
            </p>
          </div>
        )}

        {failure && (
          <Banner tone={variant.kind === 'timed_out' ? 'warning' : 'danger'} title={failure[0]}>
            {failure[1]}
          </Banner>
        )}
      </div>

      <ActionDock>
        {variant.kind === 'success' ? (
          <Button fullWidth onClick={page.trackOrder}>
            Track my order
          </Button>
        ) : variant.kind === 'redirect' ? (
          <a
            href={variant.url}
            className="type-title inline-flex h-13 w-full items-center justify-center gap-2 rounded-md bg-primary text-on-primary"
          >
            Continue to secure checkout
            <ExternalLink aria-hidden="true" className="size-5" />
          </a>
        ) : failed ? (
          <Button
            fullWidth
            onClick={page.sendAgain}
            loading={page.resending}
            disabled={page.resendInSeconds > 0}
          >
            {withWait(variant.kind === 'failed' ? 'Try again' : 'Send a new request', page.resendInSeconds)}
          </Button>
        ) : (
          <Button
            variant="secondary"
            fullWidth
            onClick={page.sendAgain}
            loading={page.resending}
            disabled={page.resendInSeconds > 0}
          >
            {withWait('Resend prompt', page.resendInSeconds)}
          </Button>
        )}
        {variant.kind !== 'success' && variant.kind !== 'redirect' && (
          <Button variant="ghost" fullWidth onClick={page.changeNumber}>
            Change phone number
          </Button>
        )}
      </ActionDock>

      <ConfirmDialog
        open={page.leaveOpen}
        onOpenChange={page.setLeaveOpen}
        title="Leave payment?"
        body="You can come back with your link. If you already entered your PIN, the payment still goes through."
        confirmLabel="Leave"
        cancelLabel="Stay"
        onConfirm={page.leave}
      />
    </div>
  )
}
