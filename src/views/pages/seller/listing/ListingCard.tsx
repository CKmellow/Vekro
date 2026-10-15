import { Archive, Copy, Eye, Link2, Package, Pencil, Share2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { StatusView } from '@/lib/status'
import { formatKes } from '@/lib/money'
import { StatusPill } from '../../../components/domain/StatusPill'
import { ActionsMenu } from '../../../components/ui/ActionsMenu'

export interface ListingCardData {
  id: string
  title: string
  price: number
  isSerialized: boolean
  photoUrl: string | undefined
  views: number | null
  status: StatusView
  /** Paid or sold listings cannot be edited or archived. */
  locked: boolean
}

export interface ListingCardActions {
  onOpen: () => void
  onCopy: () => void
  onShare: () => void
  onEdit: () => void
  onDuplicate: () => void
  onArchive: () => void
}

const TypeTag = ({ serial }: { serial: boolean }) => (
  <span
    className={cn(
      'type-label rounded-full px-2.5 py-1',
      serial ? 'bg-lake-50 text-lake-600' : 'bg-sand-100 text-ink-600',
    )}
  >
    {serial ? 'Serial-numbered' : 'Standard'}
  </span>
)

function Menu({ data, actions }: { data: ListingCardData; actions: ListingCardActions }) {
  return (
    <ActionsMenu
      label={`More actions for ${data.title}`}
      actions={[
        { label: 'Share', Icon: Share2, onSelect: actions.onShare },
        ...(data.locked ? [] : [{ label: 'Edit', Icon: Pencil, onSelect: actions.onEdit }]),
        { label: 'Duplicate', Icon: Copy, onSelect: actions.onDuplicate },
        ...(data.locked
          ? []
          : [{ label: 'Archive', Icon: Archive, onSelect: actions.onArchive, destructive: true }]),
      ]}
    />
  )
}

const Photo = ({ url, className }: { url: string | undefined; className?: string }) => (
  <span className={cn('grid place-items-center overflow-hidden bg-sand-100 text-ink-400', className)}>
    {url ? (
      <img src={url} alt="" className="size-full object-cover" />
    ) : (
      <Package aria-hidden="true" className="size-8" />
    )}
  </span>
)

/** S8 grid card. The title opens the listing; Copy link and the menu act on it. */
export function ListingCard({
  data,
  actions,
  layout,
}: {
  data: ListingCardData
  actions: ListingCardActions
  layout: 'grid' | 'list'
}) {
  if (layout === 'list') {
    return (
      <li className="flex items-center gap-4 rounded-lg bg-surface p-3 shadow-1">
        <Photo url={data.photoUrl} className="size-16 shrink-0 rounded-md" />
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <button
            type="button"
            onClick={actions.onOpen}
            className="type-body-md truncate text-left font-semibold text-text hover:underline"
          >
            {data.title}
          </button>
          <span className="type-title text-text">{formatKes(data.price)}</span>
          <span className="flex flex-wrap items-center gap-1.5">
            <TypeTag serial={data.isSerialized} />
            <StatusPill status={data.status} />
          </span>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={actions.onCopy}
            aria-label={`Copy link for ${data.title}`}
            className="grid size-10 place-items-center rounded-md border border-border text-ink-600 hover:bg-sand-100"
          >
            <Link2 aria-hidden="true" className="size-5" />
          </button>
          <Menu data={data} actions={actions} />
        </div>
      </li>
    )
  }
  return (
    <li className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-1">
      <div className="relative">
        <Photo url={data.photoUrl} className="aspect-square w-full rounded-md" />
        <span className="absolute top-2 left-2">
          <TypeTag serial={data.isSerialized} />
        </span>
      </div>
      <button
        type="button"
        onClick={actions.onOpen}
        className="type-body-md text-left font-semibold text-text hover:underline"
      >
        {data.title}
      </button>
      <span className="type-title -mt-2 text-text">{formatKes(data.price)}</span>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <StatusPill status={data.status} />
        {data.views !== null && (
          <span className="type-mono inline-flex items-center gap-1 text-text-muted">
            <Eye aria-hidden="true" className="size-3.5" />
            {data.views} views
          </span>
        )}
      </div>
      <div className="mt-auto flex gap-2 border-t border-border pt-3">
        <button
          type="button"
          onClick={actions.onCopy}
          className="type-body-sm inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-md border border-border font-semibold text-text hover:bg-sand-100"
        >
          <Link2 aria-hidden="true" className="size-4" />
          Copy link
        </button>
        <Menu data={data} actions={actions} />
      </div>
    </li>
  )
}
