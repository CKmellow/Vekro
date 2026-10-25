import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Link } from 'react-router'
import { useTransactionsExplorer } from '@/controllers/useTransactionsExplorer'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { StatusPill } from '../../components/domain/StatusPill'
import { MoneyText } from '../../components/ui/MoneyText'
import { TimelinePanel } from '../buyer/timeline/TimelinePanel'

const input =
  'h-10 rounded-sm border border-dark-border bg-dark-surface px-3 text-dark-text focus:border-plum-500 focus:outline-none'

/** A4 Transactions explorer (design/A4-transactions). Route /admin/transactions. Read only. */
export function TransactionsPage() {
  const p = useTransactionsExplorer()
  const reduce = useReducedMotion()

  return (
    <div className="flex flex-col gap-6">
      <h1 className="type-display-lg">Transactions</h1>

      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          p.submitSearch()
        }}
        className="flex gap-3"
      >
        <label className="flex h-14 flex-1 items-center gap-3 rounded-md border border-dark-border bg-dark-surface px-4 focus-within:border-plum-500">
          <Search aria-hidden="true" className="size-5 text-dark-text-muted" />
          <span className="sr-only">Search orders</span>
          <input
            type="search"
            value={p.search}
            onChange={(e) => p.setSearch(e.target.value)}
            placeholder="Order reference, phone, seller or serial number"
            className="type-body-lg min-w-0 flex-1 bg-transparent placeholder:text-dark-text-muted focus:outline-none"
          />
        </label>
        <button
          type="submit"
          className="type-title h-14 rounded-md bg-plum-500 px-6 text-sand-0 hover:bg-plum-700"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-end gap-4">
        <div role="group" aria-label="Status" className="flex flex-wrap gap-2">
          {p.groups.map((g) => (
            <button
              key={g.value}
              type="button"
              aria-pressed={g.active}
              onClick={() => p.toggleGroup(g.value)}
              className={cn(
                'type-body-sm min-h-10 rounded-full border px-3 font-semibold',
                g.active
                  ? 'border-plum-500 bg-plum-500/20'
                  : 'border-dark-border text-dark-text-muted hover:bg-dark-surface-raised',
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <label className="flex flex-col gap-1">
          <span className="type-label text-dark-text-muted">Placed from</span>
          <input
            type="date"
            value={p.from}
            onChange={(e) => p.setField('from', e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="type-label text-dark-text-muted">Placed to</span>
          <input
            type="date"
            value={p.to}
            onChange={(e) => p.setField('to', e.target.value)}
            className={input}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="type-label text-dark-text-muted">Min KES</span>
          <input
            type="number"
            min={0}
            value={p.min}
            onChange={(e) => p.setField('min', e.target.value)}
            className={cn(input, 'w-28')}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="type-label text-dark-text-muted">Max KES</span>
          <input
            type="number"
            min={0}
            value={p.max}
            onChange={(e) => p.setField('max', e.target.value)}
            className={cn(input, 'w-28')}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="type-label text-dark-text-muted">Item type</span>
          <select value={p.type} onChange={(e) => p.setField('type', e.target.value)} className={input}>
            <option value="">Any</option>
            <option value="standard">Standard</option>
            <option value="serialized">Serial-numbered</option>
          </select>
        </label>
      </div>

      <h2 className="type-title">{p.heading}</h2>

      {p.state === 'loading' && (
        <div role="status" aria-label="Loading orders" className="flex flex-col gap-2">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="h-12 animate-pulse rounded-sm bg-dark-surface" />
          ))}
        </div>
      )}
      {p.state === 'error' && (
        <div role="alert" className="flex items-center justify-between rounded-md bg-coral-500/15 px-4 py-3">
          <p className="type-body-md text-coral-500">We couldn't search orders.</p>
          <button
            type="button"
            onClick={p.retry}
            className="type-body-md min-h-10 rounded-sm border border-dark-border px-4"
          >
            Try again
          </button>
        </div>
      )}
      {p.state === 'empty' && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-dark-surface px-6 py-14 text-center">
          <p className="type-title">{p.q ? `No orders match "${p.q}"` : 'No orders match these filters'}</p>
          <button
            type="button"
            onClick={p.clear}
            className="type-body-md min-h-10 rounded-sm border border-dark-border px-4"
          >
            Clear search and filters
          </button>
        </div>
      )}

      {p.state === 'ready' && (
        <>
          <div className="overflow-clip rounded-lg border border-dark-border">
            <table className="w-full border-collapse text-left">
              <caption className="sr-only">Orders</caption>
              <thead className="type-label bg-dark-surface-raised text-dark-text-muted">
                <tr>
                  {['Order', 'Parties', 'Amount', 'Status', 'Created', 'Last event'].map((h) => (
                    <th key={h} scope="col" className={cn('px-4 py-3', h === 'Amount' && 'text-right')}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {p.rows.map((row) => (
                  <tr
                    key={row.id}
                    className="type-body-sm border-t border-dark-border hover:bg-dark-surface-raised"
                  >
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => p.open(row.id)}
                        className="font-mono font-semibold underline-offset-4 hover:text-plum-500 hover:underline"
                      >
                        {row.reference}
                      </button>
                      <p className="max-w-48 truncate text-dark-text-muted" title={row.itemTitle}>
                        {row.itemTitle}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <p>
                        {row.buyer.name}{' '}
                        <span className="font-mono text-dark-text-muted">{row.buyer.phone}</span>
                      </p>
                      <p className="text-dark-text-muted">{row.seller.name}</p>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <MoneyText amount={row.amount} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill status={row.status} />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{row.created}</td>
                    <td className="max-w-56 px-4 py-3 text-dark-text-muted">{row.lastEvent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between">
            {p.range && (
              <p className="type-body-sm text-dark-text-muted">
                Showing {p.range.from} to {p.range.to} of {p.range.of}
              </p>
            )}
            {p.pageCount > 1 && (
              <nav aria-label="Pages" className="flex items-center gap-3">
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
        </>
      )}

      <Dialog.Root open={p.selected !== null} onOpenChange={(open) => !open && p.close()}>
        <AnimatePresence>
          {p.selected !== null && (
            <Dialog.Portal forceMount>
              <Dialog.Overlay asChild forceMount>
                <motion.div
                  className="fixed inset-0 z-40 bg-scrim"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild forceMount aria-describedby={undefined}>
                <motion.aside
                  initial={reduce ? false : { x: 480 }}
                  animate={{ x: 0 }}
                  exit={reduce ? { opacity: 0 } : { x: 480 }}
                  transition={reduce ? { duration: 0 } : spring}
                  className="fixed inset-y-0 right-0 z-50 flex w-full max-w-120 flex-col gap-4 overflow-y-auto border-l border-dark-border bg-dark-surface p-6 text-dark-text [color-scheme:dark] focus:outline-none"
                >
                  <div className="flex items-center justify-between">
                    <Dialog.Title className="type-headline font-mono">
                      {p.detail?.reference ?? 'Order'}
                    </Dialog.Title>
                    <Dialog.Close className="grid size-10 place-items-center rounded-sm hover:bg-dark-surface-raised">
                      <X aria-hidden="true" className="size-5" />
                      <span className="sr-only">Close</span>
                    </Dialog.Close>
                  </div>
                  {p.detailState === 'loading' && (
                    <div
                      role="status"
                      aria-label="Loading the order"
                      className="h-40 animate-pulse rounded-lg bg-dark-surface-raised"
                    />
                  )}
                  {p.detailState === 'error' && (
                    <p role="alert" className="type-body-md text-coral-500">
                      We couldn't load this order.
                    </p>
                  )}
                  {p.detail && (
                    <>
                      <div className="flex items-center justify-between rounded-lg bg-dark-surface-raised p-4">
                        <div>
                          <p className="type-headline">
                            <MoneyText amount={p.detail.amount} />
                          </p>
                          <StatusPill status={p.detail.status} />
                        </div>
                        {p.detail.deadline && (
                          <CountdownRing
                            deadline={p.detail.deadline.at}
                            totalMs={p.detail.deadline.totalMs}
                            serverOffsetMs={p.detail.serverOffsetMs}
                            label="Time left in this state"
                          />
                        )}
                      </div>
                      <dl className="type-body-sm grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                        <dt className="text-dark-text-muted">Item</dt>
                        <dd>
                          {p.detail.itemTitle} ({p.detail.isSerialized ? 'serial-numbered' : 'standard'})
                        </dd>
                        <dt className="text-dark-text-muted">Buyer</dt>
                        <dd>
                          {p.detail.buyer.name} · <span className="font-mono">{p.detail.buyer.phone}</span>
                        </dd>
                        <dt className="text-dark-text-muted">Seller</dt>
                        <dd>
                          {p.detail.seller.name} · <span className="font-mono">{p.detail.seller.phone}</span>
                        </dd>
                      </dl>
                      {p.detail.disputeId && (
                        <Link
                          to={`/admin/cases/${p.detail.disputeId}`}
                          className="type-body-md font-semibold text-plum-500"
                        >
                          Open case
                        </Link>
                      )}
                      <div className="rounded-lg bg-surface p-4 text-text [color-scheme:light]">
                        <TimelinePanel orderId={p.detail.id} />
                      </div>
                    </>
                  )}
                </motion.aside>
              </Dialog.Content>
            </Dialog.Portal>
          )}
        </AnimatePresence>
      </Dialog.Root>
    </div>
  )
}
