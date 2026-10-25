import {
  ChevronDown,
  Clock,
  Coins,
  Handshake,
  Link2,
  Lock,
  MessageCircleQuestion,
  PackageCheck,
  ShieldCheck,
  Smartphone,
  Tag,
  Truck,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Link, Navigate } from 'react-router'
import { useLanding } from '@/controllers/useLanding'
import { LANDING_FAQ } from '@/lib/help'
import { duration } from '@/lib/motion'
import { MoneyPath } from '../../components/domain/MoneyPath'
import { VaultCard } from '../../components/domain/VaultCard'
import { PublicLayout } from '../../layouts/PublicLayout'

const STEPS = [
  { Icon: Tag, title: 'List', body: 'Add photos, a price and your dispute policy.' },
  { Icon: Link2, title: 'Share', body: 'Send your Trust Link on WhatsApp, Instagram or Facebook.' },
  {
    Icon: Lock,
    title: 'Pay into the vault',
    body: 'The buyer pays by M-Pesa. The money is locked to that one order.',
  },
  {
    Icon: PackageCheck,
    title: 'Inspect and release',
    body: "The buyer checks the item and gives a code. Then you're paid.",
  },
]

const STORY = {
  locked: {
    status: { label: 'Paid, funds held safely', tone: 'emerald', icon: 'lock' },
    ring: 'locked',
    at: 'vault',
  },
  travelling: { status: { label: 'On the way', tone: 'lake', icon: 'truck' }, ring: 'locked', at: 'vault' },
  released: {
    status: { label: 'Complete, seller paid', tone: 'emerald', icon: 'check' },
    ring: 'released',
    at: 'seller',
  },
} as const

const cta =
  'type-title inline-flex min-h-13 items-center justify-center rounded-md px-6 font-semibold transition-colors'

/** X1 Landing (design/X1-landing). Route /. */
export function LandingPage() {
  const p = useLanding()
  const reduce = useReducedMotionSafe()
  if (p.redirect) return <Navigate to={p.redirect} replace />
  const frame = STORY[p.story]

  return (
    <PublicLayout>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="bg-mesh pointer-events-none absolute inset-x-0 top-0 h-80" />
        <div className="relative mx-auto grid max-w-300 items-center gap-12 px-5 py-14 lg:grid-cols-2 lg:px-6 lg:py-24">
          <div className="flex flex-col gap-6">
            <h1 className="type-display-xl text-balance text-text">
              Sell on social media. Get paid when they're happy.
            </h1>
            <p className="type-body-lg max-w-xl text-ink-600">
              Vekro holds the buyer's money until they've checked the item. No cash-on-delivery losses, no
              "send money first" worries.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className={`${cta} bg-primary text-on-primary shadow-highlight hover:bg-primary-hover`}
              >
                Start selling
              </Link>
              <a
                href="#how-it-works"
                className={`${cta} border border-border bg-surface text-text hover:bg-sand-100`}
              >
                How it works
              </a>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm">
            <div
              aria-label="An order in Vekro, from payment to payout"
              role="img"
              className="rounded-xl border-8 border-ink-950 bg-background p-4 shadow-3"
            >
              <div className="flex flex-col gap-3">
                <VaultCard
                  reference="VK-7K3P9Q"
                  amountLabel="iPhone 13"
                  amount={52000}
                  status={frame.status}
                  ring={frame.ring}
                />
                <div className="rounded-lg bg-surface p-4 shadow-1">
                  <MoneyPath
                    buyer={{ title: 'Buyer' }}
                    vault={{ title: 'Vault' }}
                    seller={{ title: 'You' }}
                    position={frame.at}
                  />
                </div>
                <p className="type-body-sm flex items-center gap-2 rounded-md bg-surface px-4 py-3 text-ink-600 shadow-1">
                  {p.story === 'travelling' ? (
                    <Truck aria-hidden="true" className="size-4 text-lake-600" />
                  ) : p.story === 'released' ? (
                    <Coins aria-hidden="true" className="size-4 text-emerald-700" />
                  ) : (
                    <Lock aria-hidden="true" className="size-4 text-emerald-700" />
                  )}
                  {p.story === 'locked'
                    ? 'The buyer paid. The money is in the vault.'
                    : p.story === 'travelling'
                      ? 'Your item is on its way.'
                      : 'The buyer accepted. You got paid.'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-it-works"
        aria-labelledby="how-heading"
        className="mx-auto max-w-300 scroll-mt-20 px-5 py-16 lg:px-6"
      >
        <h2 id="how-heading" className="type-display-lg mb-8 text-text">
          How it works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ Icon, title, body }, i) => (
            <motion.li
              key={title}
              initial={reduce ? false : { opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: reduce ? 0 : duration.state, delay: reduce ? 0 : i * 0.06 }}
              className="flex flex-col gap-3 rounded-lg bg-surface p-6 shadow-1"
            >
              <span className="grid size-12 place-items-center rounded-md bg-emerald-50 text-emerald-700">
                <Icon aria-hidden="true" className="size-6" />
              </span>
              <span className="type-label text-text-muted">Step {i + 1}</span>
              <h3 className="type-title text-text">{title}</h3>
              <p className="type-body-md text-ink-600">{body}</p>
            </motion.li>
          ))}
        </ol>
      </section>

      <section
        id="for-sellers"
        aria-label="Protection"
        className="mx-auto grid max-w-300 scroll-mt-20 gap-4 px-5 pb-16 lg:grid-cols-2 lg:px-6"
      >
        {[
          {
            title: 'For buyers',
            Icon: ShieldCheck,
            points: [
              'Pay only into the vault, never straight to a stranger.',
              'Check the item before you release the money.',
              'Report a fault on serial-numbered items within 24 hours.',
            ],
          },
          {
            title: 'For sellers',
            Icon: Handshake,
            points: [
              'Know the buyer has paid before you ship.',
              'Get paid when they accept, or automatically when the timer runs out.',
              'Clear rules, agreed up front, if something goes wrong.',
            ],
          },
        ].map(({ title, Icon, points }) => (
          <div key={title} className="flex flex-col gap-4 rounded-xl bg-surface p-8 shadow-1">
            <span className="grid size-12 place-items-center rounded-md bg-emerald-50 text-emerald-700">
              <Icon aria-hidden="true" className="size-6" />
            </span>
            <h2 className="type-headline text-text">{title}</h2>
            <ul className="type-body-md flex flex-col gap-2 text-ink-600">
              {points.map((point) => (
                <li key={point} className="flex gap-2">
                  <span aria-hidden="true" className="mt-2 size-1.5 shrink-0 rounded-full bg-emerald-600" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>

      <section aria-label="Why people trust Vekro" className="border-y border-border bg-surface">
        <ul className="type-body-md mx-auto grid max-w-300 gap-6 px-5 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-6">
          {[
            { Icon: Smartphone, text: 'Pay with M-Pesa' },
            { Icon: Lock, text: 'Money held for each order' },
            { Icon: Clock, text: 'Clear timers, no guesswork' },
            { Icon: MessageCircleQuestion, text: 'Real people for disputes' },
          ].map(({ Icon, text }) => (
            <li key={text} className="flex items-center gap-3 font-semibold text-text">
              <Icon aria-hidden="true" className="size-5 text-emerald-700" />
              {text}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="faq-heading" className="mx-auto max-w-3xl px-5 py-16">
        <h2 id="faq-heading" className="type-display-lg mb-6 text-text">
          Questions
        </h2>
        <div className="flex flex-col gap-2">
          {LANDING_FAQ.map((item) => (
            <details key={item.id} className="group rounded-lg bg-surface px-5 shadow-1">
              <summary className="type-title flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 text-text">
                {item.q}
                <ChevronDown
                  aria-hidden="true"
                  className="size-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
                />
              </summary>
              <p className="type-body-md pb-5 text-ink-600">{item.a}</p>
            </details>
          ))}
        </div>
        <p className="type-body-md mt-6">
          <Link to="/help" className="font-semibold text-primary">
            More answers in Help
          </Link>
        </p>
      </section>

      <section className="bg-vault">
        <div className="mx-auto flex max-w-300 flex-col items-start gap-6 px-5 py-16 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <h2 className="type-display-lg text-sand-0">Ready to sell with confidence?</h2>
          <Link to="/register" className={`${cta} bg-sand-0 text-emerald-900 hover:bg-sand-100`}>
            Start selling
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}

function useReducedMotionSafe() {
  return useReducedMotion() ?? false
}
