import {
  Check,
  CircleAlert,
  Hourglass,
  Lock,
  LockOpen,
  Package,
  RotateCcw,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'
import { duration, spring } from '@/lib/motion'
import type { LockRingState } from '@/lib/status'

const SIZE = 72
const STROKE = 4
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

interface Look {
  Icon: LucideIcon
  /** Ring and icon colour on the vault surface. */
  tone: string
  dashed?: boolean
  animation?: string
}

const looks: Record<LockRingState, Look> = {
  open: { Icon: LockOpen, tone: 'text-emerald-glow', dashed: true },
  locked: { Icon: Lock, tone: 'text-emerald-glow', animation: 'animate-breathe' },
  pulse: { Icon: Truck, tone: 'text-saffron-500', animation: 'animate-ring-pulse' },
  draining: { Icon: Hourglass, tone: 'text-saffron-500' },
  releasing: { Icon: LockOpen, tone: 'text-emerald-glow' },
  released: { Icon: Check, tone: 'text-emerald-glow' },
  refunded: { Icon: RotateCcw, tone: 'text-emerald-glow' },
  returned: { Icon: RotateCcw, tone: 'text-coral-500' },
  coral: { Icon: CircleAlert, tone: 'text-coral-500' },
  lake: { Icon: Package, tone: 'text-lake-500' },
  plum: { Icon: ShieldCheck, tone: 'text-plum-500' },
}

export interface LockRingProps {
  state: LockRingState
  /** Share of time left for `draining` (1 = full, 0 = empty), from the server deadline. */
  remaining?: number
  className?: string
}

/**
 * 72px ring with a 4px stroke. Decorative: the vault card states the status in words.
 * Motion: dashed ring turns once per 8s (open), breathing glow (locked), amber pulse (pulse),
 * the ring fills over 600ms (releasing), and the lock clicks shut with a spring when it becomes locked.
 */
export function LockRing({ state, remaining = 1, className }: LockRingProps) {
  const reduce = useReducedMotion()
  const { Icon, tone, dashed, animation } = looks[state]
  const fraction = state === 'draining' ? Math.min(1, Math.max(0, remaining)) : 1

  return (
    <span
      aria-hidden="true"
      data-state={state}
      className={cn('relative grid size-18 shrink-0 place-items-center', tone, animation, className)}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className={cn('absolute inset-0', dashed && 'animate-ring-spin')}>
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.18}
          strokeWidth={STROKE}
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={dashed ? '6 9' : CIRCUMFERENCE}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          initial={state === 'releasing' && !reduce ? { strokeDashoffset: CIRCUMFERENCE } : false}
          animate={{ strokeDashoffset: dashed ? 0 : CIRCUMFERENCE * (1 - fraction) }}
          transition={reduce ? { duration: 0 } : { duration: duration.moment }}
        />
      </svg>
      <motion.span
        key={state}
        initial={state === 'locked' && !reduce ? { scale: 0.6 } : false}
        animate={{ scale: 1 }}
        transition={spring}
        className="relative"
      >
        <Icon className="size-7" strokeWidth={2} />
      </motion.span>
    </span>
  )
}
