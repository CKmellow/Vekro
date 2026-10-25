import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { useAdminQueue, type QueueRow } from '@/controllers/useAdminQueue'
import { cn } from '@/lib/cn'
import { MoneyText } from '../../components/ui/MoneyText'

const AGE_TONE = {
  sand: 'bg-dark-surface-raised text-dark-text-muted',
  saffron: 'bg-saffron-500/15 text-saffron-500',
  coral: 'bg-coral-500/15 text-coral-500',
}

function SortHeader({
  label,
  column,
  sort,
  onSort,
  align,
}: {
  label: string
  column: string
  sort: { key: string; direction: 'asc' | 'desc' }
  onSort: (s: { key: string; direction: 'asc' | 'desc' }) => void
  align?: 'end'
}) {
  const active = sort.key === column
  const Icon = !active ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('px-4 py-3', align === 'end' && 'text-right')}
    >
      <button
        type="button"
        onClick={() =>
          onSort({ key: column, direction: active && sort.direction === 'desc' ? 'asc' : 'desc' })
        }
        className="inline-flex items-center gap-1 uppercase hover:text-dark-text"
      >
        {label}
        <Icon aria-hidden="true" className="size-3.5" />
      </button>
    </th>
  )
}

/** A2 Escalation queue (design/A2-queue). Route /admin. */
export function QueuePage() {
  const p = useAdminQueue()
  const [focused, setFocused] = useState(0)
  const links = useRef<(HTMLAnchorElement | null)[]>([])

  // J / K move between cases, Enter opens (the focused link handles Enter itself). Never while typing.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      if (
        target.closest('input, textarea, select, [contenteditable="true"]') ||
        event.metaKey ||
        event.ctrlKey
      )
        return
      if (event.key !== 'j' && event.key !== 'k') return
      event.preventDefault()
      setFocused((current) => {
        const next = Math.min(Math.max(current + (event.key === 'j' ? 1 : -1), 0), p.rows.length - 1)
        links.current[next]?.focus()
        return next
      })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [p.rows.length])

  const chip = (active: boolean) =>
    cn(
      'type-body-sm min-h-9 rounded-full border px-3 font-semibold transition-colors',
      active
        ? 'border-plum-500 bg-plum-500/20 text-dark-text'
        : 'border-dark-border text-dark-text-muted hover:bg-dark-surface-raised',
    )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <h1 className="type-display-lg">Escalation queue</h1>
        <p className="type-body-sm text-dark-text-muted">
          <kbd className="font-mono">J</kbd> <kbd className="font-mono">K</kbd> to move ·{' '}
          <kbd className="font-mono">Enter</kbd> to open
        </p>
      </div>

      {p.staleSince && (
        <p role="status" className="type-body-sm rounded-md bg-saffron-500/15 px-4 py-3 text-saffron-500">
          You're offline. Showing the last update at <span className="font-mono">{p.staleSince}</span>.
        </p>
      )}

      <section aria-label="Queue numbers" className="grid grid-cols-4 gap-4">
        {(p.counters ?? Array.from({ length: 4 }, () => null)).map((c, i) =>
          c ? (
            <div key={c.label} className="flex flex-col gap-1 rounded-lg bg-dark-surface p-5">
              <span className="type-label text-dark-text-muted">{c.label}</span>
              <span className={cn('type-headline tabular-nums', c.alert && 'text-coral-500')}>{c.value}</span>
            </div>
          ) : (
            <div key={i} aria-hidden="true" className="h-24 animate-pulse rounded-lg bg-dark-surface" />
          ),
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Case status" className="flex gap-2">
          {p.statuses.map((s) => (
            <button
              key={s.value}
              type="button"
              aria-pressed={p.status === s.value}
              onClick={() => p.setStatus(s.value)}
              className={chip(p.status === s.value)}
            >
              {s.label}
            </button>
          ))}
        </div>
        <span aria-hidden="true" className="mx-2 h-6 w-px bg-dark-border" />
        <div role="group" aria-label="Trigger" className="flex flex-wrap gap-2">
          {p.triggerOptions.map((t) => (
            <button
              key={t.value}
              type="button"
              aria-pressed={p.triggers.has(t.value)}
              onClick={() => p.toggleTrigger(t.value)}
              className={chip(p.triggers.has(t.value))}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {p.state === 'loading' && (
        <div role="status" aria-label="Loading the queue" className="flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-sm bg-dark-surface" />
          ))}
        </div>
      )}

      {p.state === 'error' && (
        <div role="alert" className="flex items-center justify-between rounded-md bg-coral-500/15 px-4 py-3">
          <p className="type-body-md text-coral-500">We couldn't load the queue.</p>
          <button
            type="button"
            onClick={p.retry}
            className="type-body-md min-h-10 rounded-sm border border-dark-border px-4 hover:bg-dark-surface-raised"
          >
            Try again
          </button>
        </div>
      )}

      {p.state === 'empty' && (
        <div className="flex flex-col items-center gap-2 rounded-lg bg-dark-surface px-6 py-16 text-center">
          <h2 className="type-title">
            {p.filtered ? 'No cases match these triggers.' : 'Nothing waiting. Nice.'}
          </h2>
          <p className="type-body-md text-dark-text-muted">Escalated cases show here, oldest first.</p>
        </div>
      )}

      {p.state === 'ready' && (
        <div className="overflow-clip rounded-lg border border-dark-border">
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">Escalated cases</caption>
            <thead className="type-label sticky top-16 bg-dark-surface-raised text-dark-text-muted">
              <tr>
                <th scope="col" className="px-4 py-3">
                  Case
                </th>
                <th scope="col" className="px-4 py-3">
                  Order
                </th>
                <th scope="col" className="px-4 py-3">
                  Item
                </th>
                <SortHeader label="Amount" column="amount" sort={p.sort} onSort={p.setSort} align="end" />
                <th scope="col" className="px-4 py-3">
                  Trigger
                </th>
                <SortHeader label="Age" column="age" sort={p.sort} onSort={p.setSort} />
                <th scope="col" className="px-4 py-3">
                  Buyer
                </th>
                <th scope="col" className="px-4 py-3">
                  Seller
                </th>
                <th scope="col" className="px-4 py-3">
                  <span className="sr-only">Open</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {p.rows.map((row: QueueRow, i) => (
                <tr
                  key={row.disputeId}
                  className={cn(
                    'type-body-sm border-t border-dark-border border-l-3 transition-colors hover:bg-dark-surface-raised',
                    i === focused ? 'border-l-plum-500' : 'border-l-transparent',
                    i % 2 === 1 && 'bg-dark-surface',
                  )}
                >
                  <td className="px-4 py-3 font-mono">{row.caseId}</td>
                  <td className="px-4 py-3 font-mono">{row.reference}</td>
                  <td className="max-w-56 truncate px-4 py-3" title={row.itemTitle}>
                    {row.itemTitle}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <MoneyText amount={row.amount} />
                  </td>
                  <td className="px-4 py-3">
                    {row.trigger && (
                      <span className="rounded-full bg-plum-500/20 px-2.5 py-1 whitespace-nowrap text-dark-text">
                        {row.trigger}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {row.decision ? (
                      <span className="text-dark-text-muted">{row.decision}</span>
                    ) : (
                      <span
                        title={row.escalatedFull ?? undefined}
                        className={cn('rounded-full px-2.5 py-1 font-mono', AGE_TONE[row.age.tone])}
                      >
                        {row.age.label}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.buyerName}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{row.sellerName}</td>
                  <td className="px-2 py-1">
                    <Link
                      ref={(el) => {
                        links.current[i] = el
                      }}
                      to={`/admin/cases/${row.disputeId}`}
                      onFocus={() => setFocused(i)}
                      className="grid size-10 place-items-center rounded-sm text-dark-text-muted hover:bg-dark-surface-raised hover:text-dark-text focus-visible:outline-2 focus-visible:outline-plum-500"
                    >
                      <ChevronRight aria-hidden="true" className="size-4" />
                      <span className="sr-only">
                        Open case {row.caseId} for {row.reference}
                      </span>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {p.pageCount > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={p.page <= 1}
            onClick={() => p.setPage(p.page - 1)}
            className="grid size-10 place-items-center rounded-sm border border-dark-border disabled:opacity-40"
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            <span className="sr-only">Previous page</span>
          </button>
          <span className="type-body-sm text-dark-text-muted">
            Page {p.page} of {p.pageCount}
          </span>
          <button
            type="button"
            disabled={p.page >= p.pageCount}
            onClick={() => p.setPage(p.page + 1)}
            className="grid size-10 place-items-center rounded-sm border border-dark-border disabled:opacity-40"
          >
            <ChevronRight aria-hidden="true" className="size-4" />
            <span className="sr-only">Next page</span>
          </button>
        </nav>
      )}
    </div>
  )
}
