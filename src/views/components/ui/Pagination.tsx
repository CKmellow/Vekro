import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/cn'

/** Previous / next with "Page 2 of 5". Pages are 1-based. */
export function Pagination({
  page,
  pageCount,
  onPageChange,
  label = 'Pagination',
}: {
  page: number
  pageCount: number
  onPageChange: (page: number) => void
  label?: string
}) {
  if (pageCount <= 1) return null
  const button = cn(
    'grid size-11 place-items-center rounded-md border border-border bg-surface text-ink-600',
    'transition-colors duration-(--duration-tap) ease-standard hover:bg-sand-100 disabled:cursor-not-allowed disabled:opacity-40',
  )
  return (
    <nav aria-label={label} className="flex items-center justify-end gap-3">
      <button type="button" className={button} onClick={() => onPageChange(page - 1)} disabled={page <= 1}>
        <ChevronLeft aria-hidden="true" className="size-5" />
        <span className="sr-only">Previous page</span>
      </button>
      <span className="type-body-sm text-text-muted" aria-live="polite">
        Page <span className="type-mono text-text">{page}</span> of {pageCount}
      </span>
      <button
        type="button"
        className={button}
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pageCount}
      >
        <ChevronRight aria-hidden="true" className="size-5" />
        <span className="sr-only">Next page</span>
      </button>
    </nav>
  )
}
