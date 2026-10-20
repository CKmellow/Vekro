import { useOrderTimelineView } from '@/controllers/useOrderTimeline'
import { Timeline } from '../../../components/domain/Timeline'
import { Banner } from '../../../components/ui/Banner'
import { Button } from '../../../components/ui/Button'
import { Card } from '../../../components/ui/Card'
import { EmptyState } from '../../../components/ui/EmptyState'
import { Skeleton, SkeletonGroup } from '../../../components/ui/Skeleton'

/** The order's history plus what comes next. Used by B7 and the B3 Timeline tab. */
export function TimelinePanel({ orderId }: { orderId: string }) {
  const view = useOrderTimelineView(orderId)
  if (view.state === 'loading')
    return (
      <SkeletonGroup label="Loading the timeline">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </SkeletonGroup>
    )
  if (view.state === 'not_found')
    return (
      <EmptyState illustration="parcel" title="We can't find this order" body="Check the link in your SMS." />
    )
  if (view.state === 'error')
    return (
      <Banner
        tone="danger"
        title="We couldn't load the timeline."
        action={
          <Button variant="secondary" onClick={view.retry}>
            Try again
          </Button>
        }
      />
    )
  if (view.entries.length === 0)
    return (
      <EmptyState
        illustration="parcel"
        title="Nothing has happened yet"
        body="Steps appear here as they happen."
      />
    )
  return (
    <Card>
      <Timeline entries={view.entries} />
    </Card>
  )
}
