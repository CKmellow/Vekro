import { Lock, Package, ShieldCheck } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { VekroMark } from '../ui/VekroMark'

export interface BuyerPreviewData {
  title: string
  price: number
  photoUrl: string | null
  sellerName: string
  description: string
  isSerialized: boolean
  uniqueIdTail: string | null
  /** One line on what the buyer can do if something is wrong. */
  policyLine: string
}

/** The buyer's checkout page (B1) as it will look, inside a phone frame. Decorative copy of real data. */
export function BuyerPreview({ data, className }: { data: BuyerPreviewData; className?: string }) {
  const reduce = useReducedMotion()
  const flash = reduce ? false : { backgroundColor: 'var(--color-emerald-50)' }
  return (
    <div className={cn('rounded-xl bg-ink-950 p-2.5 shadow-vault', className)}>
      <div className="flex flex-col gap-3 overflow-hidden rounded-lg bg-background p-4">
        <div className="flex items-center justify-between">
          <VekroMark className="text-text [&_svg]:size-6 [&>span:last-child]:text-body-md" />
          <span className="type-body-sm inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-700">
            <ShieldCheck aria-hidden="true" className="size-3.5" />
            Protected by Vekro Escrow
          </span>
        </div>
        <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded-md bg-sand-100 text-ink-400">
          {data.photoUrl ? (
            <img src={data.photoUrl} alt="" className="size-full object-cover" />
          ) : (
            <Package aria-hidden="true" className="size-10" />
          )}
        </div>
        <div>
          <p className="type-title text-text">{data.title}</p>
          <m.p
            key={data.price}
            initial={flash}
            animate={{ backgroundColor: 'rgba(0,0,0,0)' }}
            transition={{ duration: 0.6 }}
            className="type-amount -mx-1 rounded-sm px-1 text-text"
          >
            {formatKes(data.price)}
          </m.p>
          <p className="type-body-sm text-text-muted">Sold by {data.sellerName}</p>
        </div>
        {data.isSerialized && (
          <p className="type-body-sm rounded-md bg-lake-50 p-3 text-lake-600">
            Serial-numbered · 24-hour check after delivery
            {data.uniqueIdTail && (
              <span className="type-mono mt-1 block">Serial ends {data.uniqueIdTail}</span>
            )}
          </p>
        )}
        <div className="rounded-md border border-border bg-surface p-3">
          <p className="type-body-sm font-semibold text-text">If something&apos;s wrong</p>
          <p className="type-body-sm text-ink-600">{data.policyLine}</p>
        </div>
        <span
          aria-hidden="true"
          className="type-body-md flex h-12 items-center justify-center gap-2 rounded-md bg-primary font-semibold text-on-primary"
        >
          <Lock className="size-4" />
          Pay {formatKes(data.price)} with M-Pesa
        </span>
      </div>
    </div>
  )
}
