import {
  ArrowLeft,
  Archive,
  Check,
  Copy,
  Download,
  Eye,
  MessageCircle,
  Package,
  Pencil,
  Send,
  Share2,
} from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'
import { Link } from 'react-router'
import { useListingDetail } from '@/controllers/useListingDetail'
import { formatKes } from '@/lib/money'
import { QrCode } from '../../components/domain/QrCode'
import { StatusPill } from '../../components/domain/StatusPill'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ConfirmDialog } from '../../components/ui/ConfirmDialog'
import { Skeleton, SkeletonGroup } from '../../components/ui/Skeleton'
import { OfflineBanner } from '../../components/ui/OfflineBanner'

/** Draws the shareable QR card: emerald background, title, price, QR and link. */
function downloadQrCard(qr: HTMLCanvasElement, title: string, price: string, link: string) {
  const css = getComputedStyle(document.documentElement)
  const color = (name: string) => css.getPropertyValue(name).trim()
  const card = document.createElement('canvas')
  card.width = 1080
  card.height = 1350
  const g = card.getContext('2d')
  if (!g) return
  const bg = g.createLinearGradient(0, 0, 1080, 1350)
  bg.addColorStop(0, color('--color-emerald-950'))
  bg.addColorStop(1, color('--color-emerald-800'))
  g.fillStyle = bg
  g.fillRect(0, 0, 1080, 1350)
  g.fillStyle = color('--color-sand-0')
  g.font = '800 64px "Bricolage Grotesque", sans-serif'
  g.fillText(title.slice(0, 26), 90, 180)
  g.font = '800 96px "Bricolage Grotesque", sans-serif'
  g.fillText(price, 90, 300)
  g.fillStyle = color('--color-sand-0')
  g.beginPath()
  g.roundRect(240, 380, 600, 600, 40)
  g.fill()
  g.drawImage(qr, 290, 430, 500, 500)
  g.font = '600 40px "DM Sans", sans-serif'
  g.fillText('Scan to pay safely with Vekro escrow', 90, 1100)
  g.fillStyle = color('--color-emerald-glow')
  g.font = '600 36px "JetBrains Mono", monospace'
  g.fillText(link.replace(/^https?:\/\//, ''), 90, 1170)
  const a = document.createElement('a')
  a.href = card.toDataURL('image/png')
  a.download = `vekro-${title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 40)}.png`
  a.click()
}

/** S9 Listing detail and share (design/S9-listing-detail). */
export function ListingDetailPage() {
  const d = useListingDetail()
  const qrCanvas = useRef<HTMLCanvasElement>(null)
  const [confirmArchive, setConfirmArchive] = useState(false)

  if (d.state === 'loading')
    return (
      <SkeletonGroup label="Loading listing">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-40 w-full rounded-lg" />
      </SkeletonGroup>
    )
  if (d.state === 'error')
    return (
      <Banner
        tone="danger"
        title={d.notFound ? "We can't find this listing." : "We couldn't load this listing."}
        action={
          d.notFound ? (
            <Link to="/seller/listings" className="type-body-sm font-semibold text-primary">
              Back to listings
            </Link>
          ) : (
            <Button variant="secondary" className="h-10" onClick={d.retry}>
              Try again
            </Button>
          )
        }
      />
    )

  const { listing } = d
  const lockedNote = "This listing has a paid order, so it can't be changed."
  return (
    <div className="flex flex-col gap-6">
      <OfflineBanner since={d.staleSince} note="Archiving and restoring need a connection." />
      <div className="flex flex-col gap-3">
        <Link
          to="/seller/listings"
          className="type-body-sm inline-flex min-h-11 items-center gap-1.5 self-start text-text-muted hover:text-text"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Listings
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="type-display-lg flex flex-wrap items-center gap-3 text-text">
            {listing.title}
            <StatusPill status={listing.status} />
          </h1>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="h-11"
              onClick={d.edit}
              disabled={d.paid || d.archived}
              title={d.paid ? lockedNote : undefined}
            >
              <Pencil aria-hidden="true" className="size-4" />
              Edit
            </Button>
            <Button variant="secondary" className="h-11" onClick={d.duplicate}>
              <Copy aria-hidden="true" className="size-4" />
              Duplicate
            </Button>
            <Button
              variant="danger"
              className="h-11"
              onClick={() => setConfirmArchive(true)}
              disabled={d.paid || d.archived}
              title={d.paid ? lockedNote : undefined}
            >
              <Archive aria-hidden="true" className="size-4" />
              Archive
            </Button>
          </div>
        </div>
        {d.paid && <p className="type-body-sm text-text-muted">{lockedNote}</p>}
      </div>

      {d.justPublished && !d.archived && (
        <Banner tone="info" title="Your listing is live. Share the link so buyers can pay safely." />
      )}
      {d.archived && (
        <Banner
          tone="warning"
          title="This listing is archived. Its link no longer accepts payments."
          action={
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="h-10"
                loading={d.restorePending}
                onClick={() => void d.restore()}
              >
                Restore listing
              </Button>
              <Button className="h-10" onClick={d.duplicate}>
                Duplicate as new listing
              </Button>
            </div>
          }
        />
      )}
      {d.paid && (
        <Card className="flex flex-col gap-3 border-l-4 border-emerald-600 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="type-title text-text">This listing has a paid order</p>
            <p className="type-body-sm text-text-muted">
              {formatKes(listing.price)} is held in the vault until the buyer accepts the item.
            </p>
          </div>
          <Link
            to="/seller/orders"
            className="type-body-md inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 font-semibold text-on-primary"
          >
            Open orders
          </Link>
        </Card>
      )}

      {!d.paid && !d.archived && (
        <section
          aria-labelledby="share"
          className="bg-vault grid gap-6 rounded-xl p-6 text-sand-0 shadow-vault sm:p-8 lg:grid-cols-[1fr_auto]"
        >
          <div className="flex min-w-0 flex-col gap-5">
            <div>
              <h2 id="share" className="type-display-lg">
                Your Trust Link is ready
              </h2>
              <p className="type-body-md mt-1 text-emerald-100">
                Send it to buyers on WhatsApp, Instagram or Facebook. They pay into the vault before you
                dispatch.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-md border border-emerald-glow/20 bg-emerald-950/40 p-2 pl-4">
              <span className="type-mono min-w-0 flex-1 truncate text-emerald-glow">
                {d.link.replace(/^https?:\/\//, '')}
              </span>
              <button
                type="button"
                onClick={d.copyLink}
                className="type-body-sm inline-flex h-10 shrink-0 items-center gap-1.5 rounded-sm bg-emerald-glow px-4 font-semibold text-emerald-950"
              >
                <Copy aria-hidden="true" className="size-4" />
                Copy
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              <a
                href={d.share.whatsapp}
                target="_blank"
                rel="noreferrer"
                className="type-body-md inline-flex h-12 items-center gap-2 rounded-md bg-surface px-5 font-semibold text-text"
              >
                <MessageCircle aria-hidden="true" className="size-5 text-emerald-600" />
                Share on WhatsApp
              </a>
              <a
                href={d.share.facebook}
                target="_blank"
                rel="noreferrer"
                className="type-body-sm inline-flex h-12 items-center gap-2 rounded-md border border-emerald-glow/25 px-4 font-semibold"
              >
                <Share2 aria-hidden="true" className="size-4" />
                Facebook
              </a>
              <a
                href={d.share.telegram}
                target="_blank"
                rel="noreferrer"
                className="type-body-sm inline-flex h-12 items-center gap-2 rounded-md border border-emerald-glow/25 px-4 font-semibold"
              >
                <Send aria-hidden="true" className="size-4" />
                Telegram
              </a>
              <button
                type="button"
                onClick={d.copyMessage}
                className="type-body-sm inline-flex h-12 items-center gap-2 rounded-md border border-emerald-glow/25 px-4 font-semibold"
              >
                <Check aria-hidden="true" className="size-4" />
                Copy message
              </button>
            </div>
            <p className="type-mono rounded-md bg-emerald-950/40 p-4 text-emerald-100">{d.caption}</p>
          </div>
          <div className="flex flex-col items-center gap-3 self-start rounded-lg bg-surface p-4 text-text">
            <QrCode
              value={d.link}
              label={`QR code for ${listing.title}`}
              size={150}
              className="border-0 p-0"
            />
            <QRCodeCanvas ref={qrCanvas} value={d.link} size={500} className="hidden" aria-hidden="true" />
            <button
              type="button"
              onClick={() =>
                qrCanvas.current &&
                downloadQrCard(qrCanvas.current, listing.title, formatKes(listing.price), d.link)
              }
              className="type-body-sm inline-flex items-center gap-1.5 font-semibold text-primary"
            >
              <Download aria-hidden="true" className="size-4" />
              Download QR card
            </button>
          </div>
        </section>
      )}

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 lg:grid-cols-2">
        <Card className="flex flex-col gap-4">
          <h2 className="type-title text-text">Item</h2>
          <div className="flex gap-2">
            {(listing.photoUrls.length ? listing.photoUrls : [null]).map((url, i) => (
              <span
                key={url ?? i}
                className="grid size-24 place-items-center overflow-hidden rounded-md bg-sand-100 text-ink-400"
              >
                {url ? (
                  <img src={url} alt="" className="size-full object-cover" />
                ) : (
                  <Package aria-hidden="true" className="size-6" />
                )}
              </span>
            ))}
          </div>
          <dl className="type-body-md flex flex-col divide-y divide-border">
            <div className="flex justify-between py-2">
              <dt className="text-ink-600">Price</dt>
              <dd className="font-semibold">{formatKes(listing.price)}</dd>
            </div>
            <div className="flex justify-between py-2">
              <dt className="text-ink-600">You receive</dt>
              <dd className="font-semibold text-emerald-700">{formatKes(listing.payout.net)}</dd>
            </div>
            {listing.category && (
              <div className="flex justify-between py-2">
                <dt className="text-ink-600">Category</dt>
                <dd>{listing.category}</dd>
              </div>
            )}
            <div className="flex justify-between gap-4 py-2">
              <dt className="text-ink-600">Item type</dt>
              <dd className="text-right">
                {listing.isSerialized ? 'Serial-numbered' : 'Standard'}
                {listing.uniqueIdTail && <span className="type-mono ml-2">ends {listing.uniqueIdTail}</span>}
              </dd>
            </div>
            <div className="flex flex-col gap-1 py-2">
              <dt className="text-ink-600">Dispute policy</dt>
              <dd className="text-text">{listing.policyLine}</dd>
            </div>
          </dl>
        </Card>
        <Card className="flex flex-col gap-3">
          <h2 className="type-title text-text">Activity</h2>
          {listing.views !== null ? (
            <p className="type-headline flex items-center gap-2 text-text">
              <Eye aria-hidden="true" className="size-5 text-ink-400" />
              {listing.views} views
            </p>
          ) : (
            <p className="type-body-md text-text-muted">Views will show here once Vekro counts them.</p>
          )}
          {!d.paid && (
            <p className="type-body-sm text-text-muted">
              No orders yet. You&apos;ll see the buyer here once they pay.
            </p>
          )}
        </Card>
      </div>

      <ConfirmDialog
        open={confirmArchive}
        onOpenChange={setConfirmArchive}
        destructive
        title={`Archive ${listing.title}?`}
        body="Its Trust Link stops taking payments. You can duplicate it later."
        confirmLabel="Archive listing"
        loading={d.archivePending}
        onConfirm={async () => {
          await d.archive()
          setConfirmArchive(false)
        }}
      />
    </div>
  )
}
