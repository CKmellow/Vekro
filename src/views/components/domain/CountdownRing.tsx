import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatCountdown, remainingMs } from '@/lib/time'

const SIZE = 56
const STROKE = 4
const R = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * R

export interface CountdownRingProps {
  /** Server deadline (ISO). */
  deadline: string
  /** Full length of this timer in ms, for the share drawn on the ring. */
  totalMs: number
  /** Server time minus device time, measured at fetch. */
  serverOffsetMs?: number
  /** What the timer is for: "Time left to dispatch". */
  label: string
  /** Seconds left at which screen readers hear the time (DESIGN.md: 10 min and 1 min). */
  announceAt?: number[]
  onExpire?: () => void
  className?: string
}

/** 56px ring, time in mono at the centre; saffron, coral under 10% left; ticks every second. */
export function CountdownRing({
  deadline,
  totalMs,
  serverOffsetMs = 0,
  label,
  announceAt = [600, 60],
  onExpire,
  className,
}: CountdownRingProps) {
  const [left, setLeft] = useState(() => remainingMs(deadline, serverOffsetMs))
  const [announcement, setAnnouncement] = useState('')
  const announced = useRef(new Set<number>())
  const expired = useRef(false)

  useEffect(() => {
    const tick = () => setLeft(remainingMs(deadline, serverOffsetMs))
    tick()
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [deadline, serverOffsetMs])

  useEffect(() => {
    const seconds = Math.ceil(left / 1000)
    for (const mark of announceAt) {
      if (seconds <= mark && seconds > mark - 2 && !announced.current.has(mark)) {
        announced.current.add(mark)
        setAnnouncement(`${label}: ${formatCountdown(left).spoken}`)
      }
    }
    if (left === 0 && !expired.current) {
      expired.current = true
      onExpire?.()
    }
  }, [left, announceAt, label, onExpire])

  const share = totalMs > 0 ? Math.min(1, left / totalMs) : 0
  const urgent = share < 0.1
  const { lines, spoken } = formatCountdown(left)

  return (
    <span
      role="timer"
      aria-label={`${label}: ${spoken}`}
      className={cn('relative inline-grid size-14 shrink-0 place-items-center', className)}
    >
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} aria-hidden="true" className="absolute inset-0">
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
          className={cn(
            'transition-[stroke-dashoffset] duration-1000 ease-linear',
            urgent ? 'stroke-coral-500' : 'stroke-saffron-500',
          )}
        />
      </svg>
      <span
        aria-hidden="true"
        className={cn(
          'relative flex flex-col items-center font-mono text-label leading-4 font-bold tabular-nums',
          urgent ? 'text-coral-600' : 'text-saffron-700',
        )}
      >
        {lines.map((line) => (
          <span key={line}>{line}</span>
        ))}
      </span>
      <span className="sr-only" aria-live="polite">
        {announcement}
      </span>
    </span>
  )
}
