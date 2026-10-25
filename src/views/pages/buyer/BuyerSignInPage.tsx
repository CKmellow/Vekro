import { MessageSquareText, Smartphone } from 'lucide-react'
import { Link, Navigate } from 'react-router'
import { useBuyerSignIn } from '@/controllers/useBuyerSignIn'
import { PhoneCodeSteps } from '../../components/domain/PhoneCodeSteps'

/** B8 Buyer sign-in (design/B8-buyer-sign-in). Route /buyer/sign-in. */
export function BuyerSignInPage() {
  const p = useBuyerSignIn()
  if (p.redirect) return <Navigate to={p.redirect} replace />

  return (
    <div className="flex flex-col gap-6 pt-4">
      <title>Sign in · Vekro</title>
      <div className="flex flex-col items-center gap-4 text-center">
        <div
          aria-hidden="true"
          className="relative grid size-24 place-items-center rounded-xl bg-emerald-50 text-primary"
        >
          <Smartphone strokeWidth={1.5} className="size-12" />
          <span className="absolute -top-1 -right-2 grid size-9 place-items-center rounded-full bg-surface text-primary shadow-1">
            <MessageSquareText className="size-5" />
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <h1 className="type-headline text-text">See all your orders</h1>
          <p className="type-body-md text-text-muted">No password. We'll text you a code.</p>
        </div>
      </div>

      <PhoneCodeSteps flow={p} />

      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <Link to="/" className="type-body-md min-h-11 content-center font-semibold text-primary">
          Continue without an account
        </Link>
        <p className="type-body-sm text-text-muted">We only use your number to find your orders.</p>
      </div>
    </div>
  )
}
