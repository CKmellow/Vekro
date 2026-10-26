import { Lock, ShieldCheck, Truck, type LucideIcon } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { duration } from '@/lib/motion'
import { VaultCard, type VaultCardProps } from '../components/domain/VaultCard'
import { VekroMark } from '../components/ui/VekroMark'

const BENEFITS: { Icon: LucideIcon; text: string }[] = [
  { Icon: Lock, text: 'Buyers pay into escrow, you ship with confidence' },
  { Icon: Truck, text: 'Get paid when the buyer accepts the item' },
  { Icon: ShieldCheck, text: 'Fewer fake orders and no cash-on-delivery losses' },
]

export interface AuthLayoutProps {
  /** Panel headline: "Sell on social media without getting scammed", "Welcome back". */
  headline: string
  lead: string
  /** Show the three benefit rows (sign up). */
  benefits?: boolean
  /** The mini vault on the panel (desktop), from useAuthShowcase. */
  vault: Omit<VaultCardProps, 'className'>
  children: ReactNode
}

/**
 * S1 and S2: from 1024px an emerald vault panel (55%) beside the sand form panel; on phones an emerald
 * header strip with the form card overlapping it.
 */
export function AuthLayout({ headline, lead, benefits = false, vault, children }: AuthLayoutProps) {
  const reduce = useReducedMotion()
  return (
    <div className="min-h-dvh bg-background lg:grid lg:grid-cols-[55fr_45fr]">
      <section
        aria-label="About Vekro"
        className="bg-vault relative overflow-hidden px-5 pt-6 pb-16 text-sand-0 lg:flex lg:flex-col lg:px-14 lg:py-12"
      >
        <VekroMark className="text-sand-0" />
        <div className="mt-6 flex max-w-xl flex-col gap-3 lg:mt-auto lg:gap-5">
          <h1 className="type-display-lg lg:type-display-xl text-balance">{headline}</h1>
          <p className="type-body-md lg:type-body-lg max-w-md text-emerald-100">{lead}</p>
        </div>
        {benefits && (
          <ul className="mt-8 hidden flex-col gap-4 lg:flex">
            {BENEFITS.map(({ Icon, text }) => (
              <li key={text} className="type-body-md flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-sm border border-emerald-glow/20 bg-emerald-glow/10 text-emerald-glow">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-10 hidden max-w-md lg:mb-auto lg:block" aria-hidden="true">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={vault.status.label}
              initial={reduce ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: duration.state }}
            >
              <VaultCard {...vault} className="border border-emerald-glow/15" />
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
      <main className="relative -mt-10 px-4 pb-10 lg:mt-0 lg:grid lg:place-items-center lg:px-10 lg:py-12">
        <div className="mx-auto w-full max-w-110 rounded-lg bg-surface p-5 shadow-1 sm:p-8">{children}</div>
      </main>
    </div>
  )
}
