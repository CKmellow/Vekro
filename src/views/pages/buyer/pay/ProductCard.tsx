import { Eye, Package, ScanBarcode } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useRef, useState } from 'react'
import type { PayListingView } from '@/controllers/usePayPage'
import { cn } from '@/lib/cn'
import { Card } from '../../../components/ui/Card'
import { MoneyText } from '../../../components/ui/MoneyText'
import { PhotoViewer } from '../../../components/ui/PhotoViewer'

/** B1 hero: photos (swipe, tap to zoom), item-type pill, title, seller and the price. */
export function ProductCard({ listing, dimmed = false }: { listing: PayListingView; dimmed?: boolean }) {
  const [current, setCurrent] = useState(0)
  const [zoomed, setZoomed] = useState<number | null>(null)
  const track = useRef<HTMLDivElement>(null)
  const reduce = useReducedMotion()
  const photos = listing.photoUrls

  const goTo = (index: number) => {
    const el = track.current
    if (el) el.scrollTo({ left: index * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <Card padded={false} className={cn('overflow-hidden', dimmed && 'opacity-60')}>
      <div className="relative">
        {photos.length ? (
          <div
            ref={track}
            onScroll={(e) => setCurrent(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
            className="flex aspect-[4/3] snap-x snap-mandatory overflow-x-auto [scrollbar-width:none]"
          >
            {photos.map((url, i) => (
              <button
                key={url}
                type="button"
                onClick={() => setZoomed(i)}
                aria-label={`View photo ${i + 1} of ${photos.length} full screen`}
                className="size-full shrink-0 snap-center focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:ring-inset"
              >
                <img
                  src={url}
                  alt={i === 0 ? listing.title : ''}
                  className="size-full object-cover"
                  loading={i === 0 ? 'eager' : 'lazy'}
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="grid aspect-[4/3] place-items-center bg-sand-100 text-ink-400">
            <Package aria-hidden="true" className="size-12" />
            <span className="sr-only">No photos</span>
          </div>
        )}
        <span
          className={cn(
            'type-body-sm absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold shadow-1 backdrop-blur',
            listing.isSerialized ? 'bg-lake-50/90 text-lake-600' : 'bg-emerald-50/90 text-emerald-700',
          )}
        >
          {listing.isSerialized ? (
            <ScanBarcode aria-hidden="true" className="size-4" />
          ) : (
            <Eye aria-hidden="true" className="size-4" />
          )}
          {listing.isSerialized ? 'Serial-numbered' : 'Inspect at your door'}
        </span>
      </div>

      {photos.length > 1 && (
        <div className="flex justify-center gap-1 pt-3">
          {photos.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Photo ${i + 1} of ${photos.length}`}
              aria-current={i === current ? 'true' : undefined}
              className="grid size-6 place-items-center"
            >
              <span
                className={cn(
                  'h-1.5 rounded-full transition-[width,background-color] duration-(--duration-state)',
                  i === current ? 'w-4 bg-emerald-700' : 'w-1.5 bg-sand-300',
                )}
              />
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-4 p-5">
        <h1 className="type-headline line-clamp-2 text-balance text-text">{listing.title}</h1>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="type-body-md grid size-10 shrink-0 place-items-center rounded-full bg-emerald-50 font-bold text-emerald-700"
          >
            {listing.seller.initials}
          </span>
          <div className="min-w-0">
            {/* No "verified" badge: the backend has no seller verification to back it. */}
            <p className="type-body-md font-semibold text-text">{listing.seller.name}</p>
            <p className="type-body-sm text-text-muted">{listing.seller.meta}</p>
          </div>
        </div>
        <MoneyText amount={listing.price} countUp className="type-amount text-text" />
      </div>

      <PhotoViewer photos={photos} index={zoomed} title={listing.title} onClose={() => setZoomed(null)} />
    </Card>
  )
}
