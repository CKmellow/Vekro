import { Hammer } from 'lucide-react'
import { StatusPage } from './StatusPage'

/** Actions that always lead to a built page, for visitors outside the seller area. */
const PUBLIC_ACTIONS = {
  primary: { label: 'Seller log in', to: '/login' },
  secondary: { label: 'Start selling', to: '/register' },
}

/** Unknown URL. */
export function NotFoundPage() {
  return (
    <StatusPage
      illustration={
        <p aria-hidden="true" className="type-display-xl text-primary tabular-nums">
          404
        </p>
      }
      title="We can't find that page"
      body="The link may be old or mistyped. If someone sent you a Vekro link, ask them to send it again."
      documentTitle="Page not found"
      {...PUBLIC_ACTIONS}
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
      illustration={
        <span
          aria-hidden="true"
          className="grid size-14 place-items-center rounded-md bg-sand-100 text-ink-600"
        >
          <Hammer className="size-7" />
        </span>
      }
      eyebrow={name}
      title="This page isn't ready yet"
      body={
        area === 'seller'
          ? "We're still building it. Your listings and payout details are saved."
          : "We're still building it. Please check back soon."
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

export function LoadingPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center" aria-busy="true">
      <span className="type-body-md text-text-muted">Loading…</span>
    </main>
  )
}
