import { StatusPage } from './StatusPage'

export function NotFoundPage() {
  return (
    <StatusPage
      title="We can't find that page"
      body="The link may be old or mistyped."
      primary={{ label: 'Go home', to: '/' }}
      secondary={{ label: 'Track an order', to: '/help' }}
    />
  )
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
