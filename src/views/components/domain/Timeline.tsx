import { motion, useReducedMotion } from 'motion/react'
import { cn } from '@/lib/cn'

export type TimelineActor = 'you' | 'seller' | 'vekro' | 'support'

export interface TimelineEntry {
  id: string
  /** Already formatted in EAT: "Today 14:36". */
  time?: string
  actor?: TimelineActor
  text: string
  /** A note quoted from the actor, such as the seller's dispatch note. */
  quote?: string
  /** Not happened yet: dashed and greyed. */
  upcoming?: boolean
}

const actors: Record<TimelineActor, { name: string; node: string; chip: string }> = {
  you: { name: 'You', node: 'bg-emerald-600', chip: 'bg-emerald-50 text-emerald-700' },
  seller: { name: 'Seller', node: 'bg-lake-500', chip: 'bg-lake-50 text-lake-600' },
  vekro: { name: 'Vekro', node: 'bg-ink-400', chip: 'bg-sand-100 text-ink-600' },
  support: { name: 'Vekro support', node: 'bg-plum-500', chip: 'bg-plum-50 text-plum-700' },
}

/** Vertical rail, newest first. Nodes draw in with a 60ms stagger; the newest pulses once. */
export function Timeline({
  entries,
  label = 'Order timeline',
}: {
  entries: TimelineEntry[]
  label?: string
}) {
  const reduce = useReducedMotion()
  const newest = entries.findIndex((e) => !e.upcoming)
  return (
    <ol aria-label={label} className="flex flex-col">
      {entries.map((entry, i) => {
        const actor = entry.actor ? actors[entry.actor] : undefined
        return (
          <motion.li
            key={entry.id}
            initial={reduce ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : i * 0.06, duration: 0.22 }}
            className="relative flex gap-4 pb-6 last:pb-0"
          >
            {i < entries.length - 1 && (
              <span
                aria-hidden="true"
                className={cn(
                  'absolute top-4 bottom-0 left-1.25 border-l-2',
                  entry.upcoming || entries[i + 1]?.upcoming
                    ? 'border-dashed border-sand-300'
                    : 'border-sand-200',
                )}
              />
            )}
            <span
              aria-hidden="true"
              className={cn(
                'relative mt-1 size-3 shrink-0 rounded-full',
                entry.upcoming ? 'border-2 border-sand-300 bg-surface' : (actor?.node ?? 'bg-ink-400'),
                i === newest && !reduce && 'motion-safe:animate-pulse-once',
              )}
            />
            <div className={cn('flex min-w-0 flex-col gap-1', entry.upcoming && 'text-ink-400')}>
              <div className="flex flex-wrap items-center gap-2">
                {entry.time && <span className="type-mono text-text-muted">{entry.time}</span>}
                {entry.upcoming && <span className="type-label">Upcoming</span>}
                {actor && !entry.upcoming && (
                  <span className={cn('type-body-sm rounded-xs px-1.5', actor.chip)}>{actor.name}</span>
                )}
              </div>
              <p className={cn('type-body-md', entry.upcoming ? 'text-ink-400' : 'text-text')}>
                {entry.text}
              </p>
              {entry.quote && (
                <blockquote className="type-body-sm rounded-sm border-l-2 border-sand-300 bg-sand-50 px-3 py-2 text-ink-600 italic">
                  “{entry.quote}”
                </blockquote>
              )}
            </div>
          </motion.li>
        )
      })}
    </ol>
  )
}
