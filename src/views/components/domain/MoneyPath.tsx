import { Lock, Store, User, type LucideIcon } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { duration, ease } from '@/lib/motion'

export type MoneyPosition = 'buyer' | 'vault' | 'seller'

export interface PathNode {
  title: string
  detail?: string
  /** Small chip under the node: "Paid with M-Pesa". */
  note?: string
}

export interface MoneyPathProps {
  buyer: PathNode
  vault: PathNode
  seller: PathNode
  /** Where the money is now. */
  position: MoneyPosition
}

const order: MoneyPosition[] = ['buyer', 'vault', 'seller']
const icons: Record<MoneyPosition, LucideIcon> = { buyer: User, vault: Lock, seller: Store }
const at = { buyer: '0%', vault: '50%', seller: '100%' }

/** Buyer, Vekro vault, Seller on one track. A glowing dot rests where the money is and glides on change. */
export function MoneyPath({ buyer, vault, seller, position }: MoneyPathProps) {
  const reduce = useReducedMotion()
  const nodes = { buyer, vault, seller }
  const current = order.indexOf(position)

  return (
    <figure className="flex flex-col gap-3">
      <figcaption className="sr-only">Money path: the money is with {nodes[position].title}.</figcaption>
      <div className="relative mx-5 h-10" aria-hidden="true">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-sand-200" />
        <motion.div
          className="absolute top-1/2 left-0 h-1 -translate-y-1/2 rounded-full bg-emerald-600"
          animate={{ width: at[position] }}
          transition={reduce ? { duration: 0 } : { duration: duration.moment, ease: [...ease] }}
        />
        {order.map((key, i) => {
          const Icon = icons[key]
          return (
            <span
              key={key}
              style={{ left: at[key] }}
              className={cn(
                'absolute top-1/2 grid size-10 -translate-1/2 place-items-center rounded-full border-2',
                i === current
                  ? 'border-emerald-600 bg-emerald-700 text-sand-0'
                  : i < current
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                    : 'border-sand-300 bg-sand-100 text-ink-600',
              )}
            >
              <Icon className="size-4.5" />
            </span>
          )
        })}
        <motion.span
          className="absolute -top-1 size-3 -translate-x-1/2 rounded-full bg-emerald-glow shadow-glow"
          initial={false}
          animate={{ left: `calc(${at[position]} + 14px)` }}
          transition={reduce ? { duration: 0 } : { duration: duration.moment, ease: [...ease] }}
        />
      </div>
      <ol className="grid grid-cols-3 gap-2">
        {order.map((key, i) => (
          <li
            key={key}
            aria-current={i === current ? 'step' : undefined}
            className={cn(
              'flex flex-col gap-0.5',
              i === 0
                ? 'items-start text-left'
                : i === 2
                  ? 'items-end text-right'
                  : 'items-center text-center',
            )}
          >
            <span className="type-body-sm font-semibold text-text">{nodes[key].title}</span>
            {nodes[key].detail && <span className="type-body-sm text-text-muted">{nodes[key].detail}</span>}
            {nodes[key].note && (
              <span className="type-body-sm mt-1 rounded-full bg-sand-100 px-2 text-ink-600">
                {nodes[key].note}
              </span>
            )}
          </li>
        ))}
      </ol>
    </figure>
  )
}
