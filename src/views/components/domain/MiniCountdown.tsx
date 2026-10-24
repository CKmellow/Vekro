import { useEffect, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatCountdown, remainingMs } from '@/lib/time'

const SIZE = 24
const STROKE = 3
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

export interface MiniCountdownProps {
  /** Server deadline (ISO). */
  deadline: string
  totalMs: number
  serverOffsetMs?: number
  /** Completes the spoken text: "41 hours 12 minutes left to dispatch". */
  label: string
}

/**
 * Table-sized countdown: a 24px ring and "41h 12m" beside it, saffron, coral under 10% left.
 * Ticks every 30 seconds (rows show minutes) and never announces, so long lists stay quiet.
 */
export function MiniCountdown({ deadline, totalMs, serverOffsetMs = 0, label }: MiniCountdownProps) {
  const [left, setLeft] = useState(() => remainingMs(deadline, serverOffsetMs))
  useEffect(() => {
    const tick = () => setLeft(remainingMs(deadline, serverOffsetMs))
    tick()
    const id = window.setInterval(tick, 30_000)
    return () => window.clearInterval(id)
  }, [deadline, serverOffsetMs])

  const share = totalMs > 0 ? Math.min(1, left / totalMs) : 0
  const urgent = share < 0.1
  const { lines, spoken } = formatCountdown(left)
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="size-6 shrink-0">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-sand-200"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={R}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - share)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className={urgent ? 'stroke-coral-500' : 'stroke-saffron-500'}
        />
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          'font-mono text-body-sm font-bold tabular-nums',
          urgent ? 'text-coral-600' : 'text-saffron-700',
        )}
      >
        {lines.join(' ')}
      </span>
      <span className="sr-only">
        {spoken.replace(/ left$/, '')} {label}
      </span>
    </span>
  )
}
