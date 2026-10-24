import {
  Bell,
  CheckCheck,
  ChevronRight,
  CircleAlert,
  Clock,
  Coins,
  ShieldCheck,
  Truck,
  type LucideIcon,
} from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import {
  useNotificationsPage,
  type NotificationKind,
  type NotificationRow,
} from '@/controllers/useNotificationsPage'
import { cn } from '@/lib/cn'
import { duration } from '@/lib/motion'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { EmptyState } from '../../components/ui/EmptyState'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'

const KINDS: Record<NotificationKind, { Icon: LucideIcon; tint: string }> = {
  money: { Icon: Coins, tint: 'bg-emerald-50 text-emerald-700' },
  delivery: { Icon: Truck, tint: 'bg-lake-50 text-lake-600' },
  problem: { Icon: CircleAlert, tint: 'bg-coral-50 text-coral-600' },
  support: { Icon: ShieldCheck, tint: 'bg-plum-50 text-plum-700' },
  time: { Icon: Clock, tint: 'bg-saffron-50 text-saffron-700' },
  other: { Icon: Bell, tint: 'bg-sand-100 text-ink-600' },
}

function Row({ row, onOpen }: { row: NotificationRow; onOpen: () => void }) {
  const reduce = useReducedMotion()
  const { Icon, tint } = KINDS[row.kind]
  return (
    <motion.li
      layout={!reduce}
      initial={reduce ? false : { opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : duration.state }}
    >
      <Link
        to={row.to}
        onClick={onOpen}
        className="flex min-h-16 w-full items-center gap-4 rounded-md px-3 py-3 text-left transition-colors hover:bg-sand-50"
      >
        <span className={cn('grid size-10 shrink-0 place-items-center rounded-full', tint)}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="sr-only">{row.unread ? 'Unread: ' : ''}</span>
          <span
            className={cn(
              'type-body-md block truncate transition-[font-weight]',
              row.unread ? 'font-bold text-text' : 'text-ink-600',
            )}
          >
            {row.title}
          </span>
          <span className="type-body-sm block truncate text-text-muted">{row.detail}</span>
        </span>
        <time dateTime={row.at} title={row.timeFull} className="type-mono shrink-0 text-text-muted">
          {row.time}
        </time>
        <span
          aria-hidden="true"
          className={cn(
            'size-2 shrink-0 rounded-full bg-emerald-600 transition-opacity duration-(--duration-state)',
            row.unread ? 'opacity-100' : 'opacity-0',
          )}
        />
        <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-ink-400" />
      </Link>
    </motion.li>
  )
}

/** S14 Notifications (design/S14-notifications). Route /seller/notifications. */
export function NotificationsPage() {
  const p = useNotificationsPage()
  return (
    <div className="mx-auto flex w-full max-w-180 flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="type-display-lg text-text">Notifications</h1>
        <Button variant="ghost" disabled={!p.canMarkAll} onClick={() => void p.markAll()}>
          <CheckCheck aria-hidden="true" className="size-5" />
          Mark all as read
        </Button>
      </div>
      <SegmentedControl
        label="Show notifications"
        segments={p.segments}
        value={p.filter}
        onChange={p.setFilter}
      />

      {p.staleSince && (
        <Banner tone="warning" title="You're offline.">
          Showing the last update at <span className="font-mono tabular-nums">{p.staleSince}</span>.
        </Banner>
      )}

      {p.state === 'loading' && (
        <SkeletonGroup label="Loading notifications">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 px-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </SkeletonGroup>
      )}

      {p.state === 'error' && (
        <Banner
          tone="danger"
          title="We couldn't load your notifications."
          action={
            <Button variant="secondary" className="h-10" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      )}

      {p.state === 'empty' &&
        (p.filter === 'all' ? (
          <div className="rounded-lg bg-surface shadow-1">
            <EmptyState
              illustration="done"
              title="You're all caught up"
              body="Payments, dispatch reminders and return updates show here."
            />
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-5 py-12 text-center shadow-1">
            <p className="type-title text-text">No unread notifications.</p>
            <Button variant="secondary" onClick={() => p.setFilter('all')}>
              Show all
            </Button>
          </div>
        ))}

      {p.state === 'ready' && (
        <div className={cn('flex flex-col gap-6 transition-opacity', p.staleSince && 'opacity-70')}>
          <AnimatePresence initial={false}>
            {p.groups.map((group) => (
              <section
                key={group.label}
                aria-labelledby={`group-${group.label}`}
                className="flex flex-col gap-1"
              >
                <h2 id={`group-${group.label}`} className="type-label px-3 text-text-muted">
                  {group.label}
                </h2>
                <ul className="flex flex-col rounded-lg bg-surface p-2 shadow-1">
                  {group.rows.map((row) => (
                    <Row key={row.id} row={row} onOpen={() => p.opened(row)} />
                  ))}
                </ul>
              </section>
            ))}
          </AnimatePresence>
          {p.hasMore && (
            <Button variant="secondary" loading={p.loadingMore} onClick={p.loadMore}>
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
