import { lazy, Suspense } from 'react'
import { Link, Navigate } from 'react-router'
import { useAuthShowcase } from '@/controllers/useAuthShowcase'
import { useLogIn, type GoogleNotice, type LogInBanner, type LogInMethod } from '@/controllers/useLogIn'
import { GoogleButton } from '../../components/domain/GoogleButton'
import { PhoneCodeSteps } from '../../components/domain/PhoneCodeSteps'
import { Banner } from '../../components/ui/Banner'
import { SegmentedControl } from '../../components/ui/SegmentedControl'
import { Skeleton } from '../../components/ui/Skeleton'
import { AuthLayout } from '../../layouts/AuthLayout'

const BANNERS: Record<
  Exclude<LogInBanner, null>,
  { tone: 'info' | 'warning' | 'escalation' | 'danger'; title: string }
> = {
  expired: { tone: 'warning', title: 'Your session expired. Log in again.' },
  reset: { tone: 'info', title: 'Password updated. Log in with your new password.' },
  'wrong-details': { tone: 'danger', title: "Phone or password doesn't match. Check them and try again." },
  offline: { tone: 'danger', title: "You're offline. Check your connection and try again." },
  server: { tone: 'danger', title: "We couldn't log you in. Try again in a moment." },
}

/** What came back from Continue with Google (backend #324). */
const GOOGLE_NOTICES: Record<Exclude<GoogleNotice, null>, { tone: 'warning' | 'danger'; title: string }> = {
  denied: {
    tone: 'warning',
    title:
      "Google didn't let this account in. While Vekro's Google sign-in is in testing, only invited accounts can use it. Log in with your phone instead.",
  },
  state: { tone: 'warning', title: 'That Google sign-in expired or was already used. Try again.' },
  failed: { tone: 'danger', title: "We couldn't confirm your Google account. Try again in a moment." },
  inactive: { tone: 'danger', title: 'This account is switched off. Contact Vekro support.' },
  unavailable: {
    tone: 'warning',
    title: "Google sign-in isn't available right now. Log in with your phone.",
  },
}

// The form and validation libraries load only when the password form shows.
const PasswordForm = lazy(() => import('./LogInPasswordForm'))

const METHODS: { value: LogInMethod; label: string }[] = [
  { value: 'password', label: 'Phone and password' },
  { value: 'code', label: 'Text me a code' },
]

/**
 * One log in for buyers, sellers and Vekro support (S2 design, design/S2-log-in): phone and password
 * for every account, or an SMS code for buyers (backend #201). Each role lands in its own area.
 */
export function LogInPage() {
  const vault = useAuthShowcase()
  const p = useLogIn()
  if (p.redirect) return <Navigate to={p.redirect} replace />

  return (
    <AuthLayout
      headline="Welcome back"
      lead="Your money is safe in the vault. Log in to pay, sell or support."
      vault={vault}
    >
      <title>Log in · Vekro</title>
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="type-headline text-text">Log in to Vekro</h2>
          <p className="type-body-md text-text-muted">Buyers, sellers and Vekro support all log in here.</p>
        </div>
        {p.banner && <Banner tone={BANNERS[p.banner].tone} title={BANNERS[p.banner].title} />}
        {p.google.notice && (
          <Banner tone={GOOGLE_NOTICES[p.google.notice].tone} title={GOOGLE_NOTICES[p.google.notice].title} />
        )}
        {p.google.enabled && (
          <>
            <GoogleButton href={p.google.href} />
            <div className="flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-border" />
              <span className="type-label-sm text-text-muted">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>
          </>
        )}
        <SegmentedControl label="How to log in" segments={METHODS} value={p.method} onChange={p.setMethod} />

        {p.method === 'code' ? (
          <div className="flex flex-col gap-5">
            <p className="type-body-md text-text-muted">
              Bought with Vekro? We'll text a code to the number you paid with. No password needed.
            </p>
            <PhoneCodeSteps flow={p.code} onUsePassword={() => p.setMethod('password')} />
          </div>
        ) : (
          <Suspense fallback={<Skeleton className="h-64 w-full" />}>
            <PasswordForm returnTo={p.returnTo} onBanner={p.onBanner} />
          </Suspense>
        )}

        <p className="type-body-md text-center text-text-muted">
          Selling on social media?{' '}
          <Link to="/register" className="font-semibold text-primary">
            Create a seller account
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
