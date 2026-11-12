import { Link } from 'react-router'
import { useAuthShowcase } from '@/controllers/useAuthShowcase'
import { useGoogleSignUp } from '@/controllers/useGoogleSignUp'
import { GoogleMark } from '../../components/domain/GoogleButton'
import { PhoneCodeSteps } from '../../components/domain/PhoneCodeSteps'
import { Banner } from '../../components/ui/Banner'
import { TextField } from '../../components/ui/Field'
import { Skeleton } from '../../components/ui/Skeleton'
import { AuthLayout } from '../../layouts/AuthLayout'

/**
 * /register/google: Continue with Google found no Vekro account. A Vekro account (buy, and sell
 * once a store is opened) is created only after the phone is verified by SMS (backend #324, #338).
 */
export function GoogleSignUpPage() {
  const vault = useAuthShowcase()
  const p = useGoogleSignUp()

  return (
    <AuthLayout
      headline="Continue with Google"
      lead="One more step: verify your phone. Payments and SMS updates go through it."
      vault={vault}
    >
      <title>Create your Vekro account · Vekro</title>
      <div className="flex flex-col gap-5">
        <h2 className="type-headline text-text">Create your Vekro account</h2>
        {p.status === 'loading' ? (
          <Skeleton className="h-40 w-full" />
        ) : p.status === 'expired' ? (
          <Banner tone="warning" title="This sign-up has expired.">
            <Link to="/login" className="font-semibold text-primary">
              Start again with Continue with Google
            </Link>
          </Banner>
        ) : (
          <>
            <div className="flex items-center gap-3 rounded-md border border-border bg-surface p-4">
              <GoogleMark />
              <p className="type-body-md flex min-w-0 flex-col text-text">
                <span className="type-label-sm text-text-muted">Google account</span>
                <span className="font-semibold break-all">{p.email}</span>
              </p>
            </div>
            <TextField
              label="Your name"
              value={p.name}
              onChange={(e) => p.setName(e.target.value)}
              autoComplete="name"
            />
            <p className="type-body-md text-text-muted">
              We'll text a code to your phone. Your account is created once you enter it. You can buy straight
              away, and open a store later.
            </p>
            <PhoneCodeSteps flow={p.flow} sendLabel="Text me a code" />
          </>
        )}
        <p className="type-body-md text-center text-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
