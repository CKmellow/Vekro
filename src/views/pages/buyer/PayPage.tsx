import { ChevronDown, Eye, KeyRound, Lock, ShieldCheck, Smartphone } from 'lucide-react'
import { AnimatePresence, m, useReducedMotion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Controller } from 'react-hook-form'
import { useParams } from 'react-router'
import { usePayPage } from '@/controllers/usePayPage'
import { cn } from '@/lib/cn'
import { duration, ease, spring } from '@/lib/motion'
import { ActionDock } from '../../components/ui/ActionDock'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Checkbox } from '../../components/ui/Choice'
import { EmptyState } from '../../components/ui/EmptyState'
import { MoneyText } from '../../components/ui/MoneyText'
import { Sheet } from '../../components/ui/Sheet'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { DetailsSection } from './pay/DetailsSection'
import { ProductCard } from './pay/ProductCard'

const STEPS = [
  { Icon: Smartphone, title: 'Pay with M-Pesa', body: 'Approve the prompt on your phone with your PIN.' },
  { Icon: Lock, title: 'Vekro holds your money', body: 'The seller sees it is paid but cannot touch it.' },
  { Icon: Eye, title: 'Inspect at your door', body: 'Open it and check it before you decide.' },
  {
    Icon: KeyRound,
    title: 'Enter your code to release payment',
    body: 'Only then does the seller get paid.',
  },
]

/** Cards fade and rise 8px, 60ms apart, on first load (B1 notes). */
function Reveal({ index, children }: { index: number; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <m.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: duration.state, ease: [...ease], delay: index * 0.06 }}
    >
      {children}
    </m.div>
  )
}

/** Expands with the spring; reduced motion swaps instantly. */
function Expand({ open, children }: { open: boolean; children: ReactNode }) {
  const reduce = useReducedMotion()
  return (
    <AnimatePresence initial={false}>
      {open && (
        <m.div
          initial={reduce ? false : { height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
          transition={reduce ? { duration: 0 } : spring}
          className="overflow-hidden"
        >
          {children}
        </m.div>
      )}
    </AnimatePresence>
  )
}

function Description({ text }: { text: string }) {
  const [open, setOpen] = useState(false)
  const long = text.length > 160 || text.split('\n').length > 3
  return (
    <Card>
      <p className={cn('type-body-md whitespace-pre-line text-ink-600', !open && long && 'line-clamp-3')}>
        {text}
      </p>
      {long && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="type-body-sm mt-2 min-h-12 font-semibold text-primary"
        >
          {open ? 'Show less' : 'Read more'}
        </button>
      )}
    </Card>
  )
}

function HowItWorks() {
  const [open, setOpen] = useState(false)
  return (
    <Card>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="how-it-works"
        className="flex min-h-12 w-full items-center justify-between gap-3 text-left"
      >
        <span className="type-title text-text">How your money stays safe</span>
        <span className="type-body-sm inline-flex shrink-0 items-center gap-1 font-semibold text-primary">
          {open ? 'Hide steps' : 'See how it works'}
          <ChevronDown
            aria-hidden="true"
            className={cn('size-4 transition-transform duration-(--duration-state)', open && 'rotate-180')}
          />
        </span>
      </button>
      <Expand open={open}>
        <ol id="how-it-works" className="mt-3 flex flex-col">
          {STEPS.map(({ Icon, title, body }, i) => (
            <li key={title} className="relative flex gap-3 pb-4 last:pb-0">
              {i < STEPS.length - 1 && (
                <span aria-hidden="true" className="absolute top-10 bottom-0 left-5 w-px bg-sand-300" />
              )}
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-700">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div className="pt-1">
                <p className="type-body-md font-semibold text-text">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </p>
                <p className="type-body-sm text-text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Expand>
    </Card>
  )
}

/** B1 Order summary and pay (design/B1-order-summary). Route /pay/:listingId. */
export function PayPage() {
  const { listingId = '' } = useParams()
  const page = usePayPage(listingId)
  const { form, listing } = page

  if (page.state === 'loading') {
    return (
      <SkeletonGroup label="Loading the item">
        <Skeleton className="aspect-[4/3] w-full rounded-lg" />
        <Skeleton className="h-7 w-4/5" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-9 w-2/5" />
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </SkeletonGroup>
    )
  }

  if (page.state === 'not_found') {
    return (
      <Card className="mt-6">
        <EmptyState
          illustration="link"
          title="We can't find this item"
          body="The link may be old or mistyped. Ask the seller to send it again."
        />
      </Card>
    )
  }

  if (page.state === 'error' || !listing) {
    return (
      <Banner
        tone="danger"
        title={page.online ? "We couldn't load this item" : "You're offline"}
        action={
          <Button variant="secondary" onClick={page.retry}>
            Try again
          </Button>
        }
      >
        {page.online ? 'Check your connection and try again.' : 'Connect to the internet to see this item.'}
      </Banner>
    )
  }

  return (
    <>
      <form noValidate onSubmit={page.onPay} className="flex flex-col gap-4">
        <Reveal index={0}>
          <ProductCard listing={listing} dimmed={listing.availability === 'withdrawn'} />
        </Reveal>
        {listing.availability === 'sold' && (
          <div role="status" className="flex gap-3 rounded-lg bg-emerald-50 p-5">
            <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-emerald-700" />
            <div>
              <p className="type-body-md font-semibold text-emerald-800">
                This item has already been paid for
              </p>
              <p className="type-body-sm text-emerald-800/80">
                If you paid for it, open the order link we sent you by SMS to track it.
              </p>
            </div>
          </div>
        )}
        {listing.availability === 'withdrawn' && (
          <div role="status" className="rounded-lg bg-sand-100 p-5">
            <p className="type-body-md font-semibold text-text">The seller has withdrawn this item</p>
            <p className="type-body-sm text-ink-600">
              It can&apos;t be paid for. Ask the seller if they have another link.
            </p>
          </div>
        )}
        {listing.description && (
          <Reveal index={1}>
            <Description text={listing.description} />
          </Reveal>
        )}
        <Reveal index={2}>
          <div className="flex gap-3 rounded-lg bg-emerald-50 p-5">
            <ShieldCheck aria-hidden="true" className="size-6 shrink-0 text-emerald-700" />
            <div>
              <p className="type-body-md font-semibold text-emerald-800">{listing.promise.title}</p>
              <p className="type-body-sm text-emerald-800/80">{listing.promise.line}</p>
            </div>
          </div>
        </Reveal>
        <Reveal index={3}>
          <HowItWorks />
        </Reveal>
        {listing.availability === 'open' && (
          <>
            <Reveal index={4}>
              <Card className="flex flex-col gap-5">
                <DetailsSection
                  identity={page.identity}
                  form={form}
                  notice={page.notice}
                  passwordHints={page.passwordHints}
                  onSwitchMode={page.switchMode}
                  onNotYou={page.notYou}
                />
                <dl className="flex flex-col gap-2 rounded-md bg-surface-sunken p-4">
                  <div className="type-body-md flex justify-between gap-3">
                    <dt className="text-ink-600">Item</dt>
                    <dd>
                      <MoneyText amount={listing.price} className="font-mono" />
                    </dd>
                  </div>
                  <div className="type-body-md flex justify-between gap-3">
                    <dt className="text-ink-600">Vekro fee</dt>
                    <dd className="text-text-muted">No extra fees for you</dd>
                  </div>
                  <div className="type-body-md flex justify-between gap-3 border-t border-border pt-2 font-bold text-text">
                    <dt>Total</dt>
                    <dd>
                      <MoneyText amount={listing.price} className="font-mono" />
                    </dd>
                  </div>
                </dl>
                <Controller
                  control={form.control}
                  name="terms"
                  render={({ field, fieldState }) => (
                    <div>
                      <Checkbox
                        name={field.name}
                        checked={field.value}
                        onChange={(e) => field.onChange(e.target.checked)}
                        onBlur={field.onBlur}
                      >
                        I agree to the{' '}
                        <button
                          type="button"
                          onClick={() => page.setTermsOpen(true)}
                          className="font-semibold text-primary underline underline-offset-2"
                        >
                          Terms
                        </button>{' '}
                        and understand how Vekro escrow works
                      </Checkbox>
                      {fieldState.error && (
                        <p role="status" className="type-body-sm text-coral-600">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  )}
                />
              </Card>
            </Reveal>
            <ActionDock note="Secured by Vekro Escrow">
              {page.payError && <Banner tone="danger" title={page.payError} />}
              <Button type="submit" fullWidth disabled={!page.canPay} loading={page.paying}>
                <Lock aria-hidden="true" className="size-5" />
                Pay {listing.priceLabel} with M-Pesa
              </Button>
              {!page.online && (
                <p role="status" className="type-body-sm text-center text-coral-600">
                  You&apos;re offline. Connect to pay.
                </p>
              )}
            </ActionDock>
          </>
        )}
      </form>

      <Sheet
        open={page.termsOpen}
        onOpenChange={page.setTermsOpen}
        title="Terms"
        footer={
          <Button variant="secondary" onClick={() => page.setTermsOpen(false)}>
            Close
          </Button>
        }
      >
        <div className="type-body-md flex flex-col gap-3 text-ink-600">
          <p>Your payment is held by Vekro for this one order. It is not a wallet and it earns nothing.</p>
          <p>
            The seller is paid only when you enter your delivery code, or when a deadline passes as shown on
            your order page.
          </p>
          <p>
            If the item is not right at your door, you can reject it and the money comes back to you, as set
            out in the seller&apos;s policy above.
          </p>
          <p>Never share your delivery code before you have checked the item.</p>
        </div>
      </Sheet>
    </>
  )
}
