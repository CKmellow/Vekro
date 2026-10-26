import { ArrowLeft, Link2 } from 'lucide-react'
import { Link, useParams } from 'react-router'
import { useOrderTimelineView } from '@/controllers/useOrderTimeline'
import { StatusPill } from '../../components/domain/StatusPill'
import { MoneyText } from '../../components/ui/MoneyText'
import { OfflineBanner } from '../../components/ui/OfflineBanner'
import { TimelinePanel } from './timeline/TimelinePanel'

/** B7 Transaction timeline (PAGES.md B7). Route /order/:orderId/timeline. */
export function TimelinePage() {
  const { orderId = '' } = useParams()
  const view = useOrderTimelineView(orderId)
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={view.back}
          aria-label="Back to your order"
          className="grid size-12 place-items-center rounded-full text-ink-600 hover:bg-sand-100"
        >
          <ArrowLeft aria-hidden="true" className="size-6" />
        </button>
        <h1 className="type-headline text-text">Order timeline</h1>
      </div>
      <OfflineBanner since={view.staleSince} />
      {view.summary && (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="type-mono text-text">{view.summary.reference}</span>
          <MoneyText amount={view.summary.amount} className="type-body-md font-semibold text-text" />
          <StatusPill status={view.summary.status} />
        </div>
      )}
      <TimelinePanel orderId={orderId} />
      <div className="type-body-sm flex justify-center gap-6">
        <button
          type="button"
          onClick={() => void view.copyLink()}
          className="inline-flex min-h-12 items-center gap-1 font-semibold text-primary"
        >
          <Link2 aria-hidden="true" className="size-4" />
          Copy link
        </button>
        <Link to="/help" className="inline-flex min-h-12 items-center font-semibold text-primary">
          Get help
        </Link>
      </div>
    </div>
  )
}
