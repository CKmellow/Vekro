import { CircleHelp, Unplug, Vault } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { useNotFound, useOffline } from '@/controllers/useFallback'
import { Button } from '@/views/components/ui/Button'
import { ConstructionScene } from '@/views/components/ui/ConstructionScene'
import { VekroMark } from '@/views/components/ui/VekroMark'
import { StatusPage } from './StatusPage'

/** Actions that always lead to a built page, for visitors outside the seller area. */
const PUBLIC_ACTIONS = {
  primary: { label: 'Seller log in', to: '/login' },
  secondary: { label: 'Start selling', to: '/register' },
}

/** X2 illustration: a geometric icon in an emerald tile that floats gently (still under reduced motion). */
function FallbackTile({ children }: { children: ReactNode }) {
  return (
    <div aria-hidden="true" className="relative mb-2 animate-float">
      <span className="absolute inset-2 rounded-full bg-emerald-glow/15 blur-xl" />
      <div className="relative grid size-28 place-items-center rounded-xl bg-emerald-50 text-primary shadow-1">
        {children}
      </div>
    </div>
  )
}

const GET_HELP = { label: 'Get help', to: '/help' }

/** X2 Not found (design/X2-not-found). Unknown URL. */
export function NotFoundPage() {
  const p = useNotFound()
  return (
    <StatusPage
      illustration={
        <FallbackTile>
          <Vault strokeWidth={1.5} className="size-14" />
          <span className="absolute -top-2 -right-2 grid size-10 place-items-center rounded-full bg-surface text-saffron-600 shadow-1">
            <CircleHelp className="size-6" />
          </span>
        </FallbackTile>
      }
      title="We can't find that page"
      body="The link may be old or mistyped. If someone sent you a Vekro link, ask them to send it again."
      documentTitle="Page not found"
      primary={p.home}
      secondary={GET_HELP}
    />
  )
}

/** X2 Offline (design/X2-not-found): a page opened with no connection and nothing to show. */
export function OfflinePage({ onRetry }: { onRetry?: () => void }) {
  const p = useOffline(onRetry)
  return (
    <StatusPage
      illustration={
        <FallbackTile>
          <Unplug strokeWidth={1.5} className="size-14" />
        </FallbackTile>
      }
      title="You're offline"
      body="Check your connection. Your orders are safe in the vault while you're away."
      primary={{ label: 'Try again', onClick: p.retry }}
      secondary={GET_HELP}
    />
  )
}

/** Where the route lives: inside the seller, buyer or admin layout, or a public page with no layout. */
export type NotReadyArea = 'seller' | 'buyer' | 'admin' | 'public'

const NOT_READY_ACTIONS: Record<
  NotReadyArea,
  { primary?: { label: string; to: string }; secondary?: { label: string; to: string } }
> = {
  seller: {
    primary: { label: 'Go to your listings', to: '/seller/listings' },
    secondary: { label: 'Create a listing', to: '/seller/listings/new' },
  },
  buyer: PUBLIC_ACTIONS,
  admin: {},
  public: PUBLIC_ACTIONS,
}

/**
 * A planned route whose page isn't built yet. Inside a layout it renders in the layout's content
 * area (nav stays); a public route gets the full page. Every action leads to a built page.
 */
export function NotReadyPage({ name, area }: { name: string; area: NotReadyArea }) {
  return (
    <StatusPage
      fullPage={area === 'public'}
      illustration={<ConstructionScene className="mb-2" />}
      title="Still under construction"
      body={
        area === 'seller'
          ? `We're building the ${name} page. Your listings and payout details are saved, so you can keep selling in the meantime.`
          : `We're building the ${name} page. Check back soon.`
      }
      documentTitle={name}
      {...NOT_READY_ACTIONS[area]}
    />
  )
}

// eslint-disable-next-line react-refresh/only-export-components -- factory for route targets
export const notReady = (area: NotReadyArea, name: string) =>
  function NotReadyRoute() {
    return <NotReadyPage area={area} name={name} />
  }

export function NoPermissionPage({ area }: { area: 'seller' | 'admin' }) {
  return (
    <StatusPage
      title={area === 'admin' ? "This account doesn't have console access" : 'This area is for sellers'}
      body="You're signed in with an account that can't open this page."
      primary={{ label: 'Go home', to: '/' }}
    />
  )
}

export function ErrorPage({ onRetry }: { onRetry?: () => void }) {
  return (
    <StatusPage
      title="Something went wrong"
      body="We couldn't load this page. Your money and orders are safe."
      primary={{ label: 'Try again', onClick: onRetry ?? (() => window.location.reload()) }}
      secondary={{ label: 'Go home', to: '/' }}
    />
  )
}

/** How long the loader waits before saying the wait is unusual and offering a retry. */
export const SLOW_AFTER_MS = 8000

/**
 * Full-page wait while the session is checked: the Vekro tile inside a turning lock ring. After
 * SLOW_AFTER_MS it says the wait is unusual and offers Try again. Reduced motion holds the ring still.
 */
export function LoadingPage({ onRetry }: { onRetry?: () => void }) {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    const timer = window.setTimeout(() => setSlow(true), SLOW_AFTER_MS)
    return () => window.clearTimeout(timer)
  }, [])

  return (
    <main
      aria-busy={!slow}
      className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-background px-5 py-10 text-center"
    >
      <title>Loading · Vekro</title>
      <div aria-hidden="true" className="bg-mesh pointer-events-none absolute inset-x-0 top-0 h-60" />
      <div className="relative grid size-28 place-items-center" aria-hidden="true">
        <span className="absolute inset-3 rounded-full bg-emerald-glow/15 blur-xl" />
        <svg viewBox="0 0 112 112" className="absolute inset-0 animate-[spin_1.4s_linear_infinite]">
          <circle cx="56" cy="56" r="50" fill="none" strokeWidth="4" className="stroke-primary/12" />
          <circle
            cx="56"
            cy="56"
            r="50"
            fill="none"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="80 234"
            className="stroke-primary"
          />
        </svg>
        <VekroMark
          wordmark={false}
          className="relative [&_svg]:size-14 [&_svg]:shadow-vault [&_svg]:rounded-md"
        />
      </div>
      <div
        role="status"
        aria-live="polite"
        className="relative mt-8 flex max-w-sm flex-col items-center gap-2"
      >
        {slow ? (
          <>
            <p className="type-title text-text">This is taking longer than usual</p>
            <p className="type-body-md text-pretty text-text-muted">
              Your connection or Vekro may be slow right now. Your money and orders are safe.
            </p>
          </>
        ) : (
          <>
            <p className="type-title text-text">Getting things ready</p>
            <p className="type-body-md text-text-muted">Checking your account. This only takes a moment.</p>
          </>
        )}
      </div>
      {slow && (
        <Button className="relative mt-6 px-6" onClick={onRetry ?? (() => window.location.reload())}>
          Try again
        </Button>
      )}
    </main>
  )
}
