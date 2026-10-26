import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Horizontal progress: filled, current (pulsing) and upcoming nodes. `current` is 0-based. */
export function Stepper({
  steps,
  current,
  label = 'Progress',
}: {
  steps: string[]
  current: number
  label?: string
}) {
  return (
    <ol aria-label={label} className="flex items-center gap-2">
      {steps.map((step, i) => {
        const done = i < current
        const active = i === current
        return (
          <li
            key={step}
            aria-current={active ? 'step' : undefined}
            className={cn(
              'flex items-center gap-2',
              active ? 'min-w-fit' : 'min-w-0',
              i < steps.length - 1 && 'flex-1',
            )}
          >
            <span
              aria-hidden="true"
              className={cn(
                'grid size-6 shrink-0 place-items-center rounded-full font-mono text-label font-bold',
                done && 'bg-emerald-600 text-sand-0',
                active && 'bg-saffron-500 text-ink-950 motion-safe:animate-ring-pulse',
                !done && !active && 'border border-sand-300 text-ink-500',
              )}
            >
              {done ? <Check className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={cn(
                'type-body-sm font-semibold',
                active ? 'shrink-0' : 'truncate',
                done ? 'text-text' : active ? 'text-saffron-700' : 'text-ink-500',
                // Narrow screens show only the current step's name.
                !active && 'max-sm:sr-only',
              )}
            >
              {step}
              <span className="sr-only">{done ? ', done' : active ? ', current step' : ', upcoming'}</span>
            </span>
            {i < steps.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'h-0.5 min-w-4 flex-1 rounded-full transition-colors duration-(--duration-moment)',
                  done ? 'bg-emerald-600' : active ? 'bg-saffron-500' : 'bg-sand-200',
                )}
              />
            )}
          </li>
        )
      })}
    </ol>
  )
}
