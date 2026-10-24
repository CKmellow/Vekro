import { LayoutGrid, List, Plus, Search, SearchX } from 'lucide-react'
import { Link } from 'react-router'
import { useListingsPage } from '@/controllers/useListingsPage'
import { cn } from '@/lib/cn'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { EmptyState } from '../../components/ui/EmptyState'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { ListingCard } from './listing/ListingCard'

const newListing = (
  <Link
    to="/seller/listings/new"
    className="type-body-md inline-flex h-11 items-center gap-2 rounded-md bg-primary px-4 font-semibold text-on-primary shadow-highlight hover:bg-primary-hover"
  >
    <Plus aria-hidden="true" className="size-5" />
    New listing
  </Link>
)

/** S8 Listings (design/S8-listings). */
export function ListingsPage() {
  const p = useListingsPage()
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="type-display-lg flex items-center gap-3 text-text">
          Listings
          {p.total !== undefined && (
            <span className="type-mono rounded-full bg-sand-100 px-3 py-1 text-ink-600">{p.total}</span>
          )}
        </h1>
        {newListing}
      </div>

      {p.state !== 'empty' && (
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="min-w-0 lg:flex-1">
            <SegmentedControl
              label="Filter listings"
              segments={p.filters}
              value={p.status}
              onChange={p.setStatus}
            />
          </div>
          <div className="flex gap-2">
            <label className="flex h-11 flex-1 items-center gap-2 rounded-md border border-border bg-surface px-3 focus-within:border-emerald-500 lg:w-64">
              <Search aria-hidden="true" className="size-4 text-ink-400" />
              <span className="sr-only">Search listings</span>
              <input
                type="search"
                value={p.q}
                onChange={(e) => p.setQ(e.target.value)}
                placeholder="Search listings"
                className="type-body-md min-w-0 flex-1 bg-transparent focus:outline-none"
              />
            </label>
            <div role="group" aria-label="View" className="flex rounded-md bg-sand-100 p-1">
              {(['grid', 'list'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={p.view === v}
                  aria-label={v === 'grid' ? 'Grid view' : 'List view'}
                  onClick={() => p.setView(v)}
                  className={cn(
                    'grid size-9 place-items-center rounded-sm',
                    p.view === v ? 'bg-surface text-text shadow-1' : 'text-ink-600',
                  )}
                >
                  {v === 'grid' ? (
                    <LayoutGrid aria-hidden="true" className="size-4" />
                  ) : (
                    <List aria-hidden="true" className="size-4" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {p.state === 'loading' && (
        <SkeletonGroup label="Loading listings">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-1">
                <Skeleton className="aspect-square w-full rounded-md" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </SkeletonGroup>
      )}

      {p.state === 'error' && (
        <Banner
          tone="danger"
          title="We couldn't load your listings."
          action={
            <Button variant="secondary" className="h-10" onClick={p.retry}>
              Try again
            </Button>
          }
        />
      )}

      {p.state === 'empty' && (
        <div className="rounded-lg bg-surface shadow-1">
          <EmptyState
            illustration="vault"
            title="Create your first listing"
            body="Make a Trust Link and share it on WhatsApp or Instagram. Buyers pay into escrow, so you ship with confidence."
            action={newListing}
          />
        </div>
      )}

      {p.state === 'no-results' && (
        <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-5 py-12 text-center shadow-1">
          <SearchX aria-hidden="true" className="size-8 text-ink-400" />
          <p className="type-title text-text">{p.q ? `No listings match "${p.q}"` : 'Nothing here yet'}</p>
          <Button variant="secondary" onClick={p.clearFilters}>
            Clear search and filters
          </Button>
        </div>
      )}

      {p.state === 'ready' && (
        <ul
          className={p.view === 'grid' ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-4' : 'flex flex-col gap-3'}
          aria-label="Listings"
        >
          {p.listings.map(({ data, actions }) => (
            <ListingCard key={data.id} data={data} actions={actions} layout={p.view} />
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={p.archiving !== null}
        onOpenChange={(open) => !open && p.askArchive(null)}
        destructive
        title={`Archive ${p.archiving?.title ?? 'this listing'}?`}
        body="Its Trust Link stops taking payments. You can duplicate it later."
        confirmLabel="Archive listing"
        onConfirm={p.confirmArchive}
        loading={p.archivePending}
      />
    </div>
  )
}
