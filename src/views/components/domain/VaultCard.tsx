import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import type { LockRingState, StatusView, Tone } from '@/lib/status'
import { MoneyText } from '../ui/MoneyText'
import { LockRing } from './LockRing'

const dot: Record<Tone, string> = {
  sand: 'bg-sand-300',
  saffron: 'bg-saffron-500',
  emerald: 'bg-emerald-glow',
  lake: 'bg-lake-500',
  coral: 'bg-coral-500',
  plum: 'bg-plum-500',
}

export interface VaultCardProps {
  /** Human reference, such as VK-7K3P9Q. */
  reference: string
  /** "Amount held", "Amount released", "Amount returned". */
  amountLabel: string
  amount: number | string
  status: StatusView
  ring: LockRingState
  /** Share of time left on the 24-hour hold, for the draining ring. */
  ringRemaining?: number
  /** One short line on what happens next: "Held until you confirm". */
  hint?: ReactNode
  className?: string
}

/** The money, on the emerald vault surface. Every buyer and seller order screen shows one. */
export function VaultCard({
  reference,
  amountLabel,
  amount,
  status,
  ring,
  ringRemaining,
  hint,
  className,
}: VaultCardProps) {
  return (
    <section
      aria-label={`Vault for order ${reference}`}
      className={cn(
        '@container flex flex-col gap-6 rounded-xl bg-vault p-6 text-sand-0 shadow-vault',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="type-mono text-emerald-glow">{reference}</span>
          <span className="type-label text-emerald-100">{amountLabel}</span>
          <MoneyText
            amount={amount}
            countUp
            // Never wrap the amount; step down on narrow cards (three-up grids, small phones).
            className="type-amount whitespace-nowrap @max-[22rem]:text-display-lg @max-xs:text-headline"
          />
        </div>
        <LockRing state={ring} remaining={ringRemaining} />
      </div>
      <div className="type-body-sm flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <span className="flex items-center gap-2 font-semibold">
          <span aria-hidden="true" className={cn('size-2 rounded-full', dot[status.tone])} />
          {status.label}
        </span>
        {hint && <span className="text-emerald-100">{hint}</span>}
      </div>
    </section>
  )
}
