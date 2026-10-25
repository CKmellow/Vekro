import { Controller } from 'react-hook-form'
import { Link } from 'react-router'
import { useAuthShowcase } from '@/controllers/useAuthShowcase'
import { useLogIn, type LogInBanner } from '@/controllers/useLogIn'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { PasswordField } from '../../components/ui/PasswordField'
import { PhoneField } from '../../components/ui/PhoneField'
import { AuthLayout } from '../../layouts/AuthLayout'

const BANNERS: Record<
  Exclude<LogInBanner, null>,
  { tone: 'info' | 'warning' | 'escalation' | 'danger'; title: string }
> = {
  expired: { tone: 'warning', title: 'Your session expired. Log in again.' },
  reset: { tone: 'info', title: 'Password updated. Log in with your new password.' },
  'wrong-role': { tone: 'escalation', title: 'This area is for sellers. Log in with a seller account.' },
  'wrong-details': { tone: 'danger', title: "Phone or password doesn't match. Check them and try again." },
  offline: { tone: 'danger', title: "You're offline. Check your connection and try again." },
  server: { tone: 'danger', title: "We couldn't log you in. Try again in a moment." },
}

/** S2 Log in (design/S2-log-in), with "Forgot password?" (backend #207). */
export function LogInPage() {
  const vault = useAuthShowcase()
  const { form, onSubmit, submitting, banner, lockedUntil, lockTotalMs, onUnlock } = useLogIn()
  const { register, control, formState } = form
  const locked = lockedUntil !== null

  return (
    <AuthLayout
      headline="Welcome back"
      lead="Your money is safe in the vault. Let's get your orders moving."
      vault={vault}
    >
      <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
        {banner && <Banner tone={BANNERS[banner].tone} title={BANNERS[banner].title} />}
        {locked && (
          <div
            role="status"
            className="flex items-center gap-4 rounded-md border border-saffron-500/30 bg-saffron-50 p-4"
          >
            <CountdownRing
              deadline={lockedUntil}
              totalMs={lockTotalMs}
              label="Log in again in"
              onExpire={onUnlock}
            />
            <div>
              <p className="type-body-md font-semibold text-saffron-700">Too many attempts.</p>
              <p className="type-body-sm text-ink-600">
                For your security, wait for the timer before trying again.
              </p>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="type-headline text-text">Log in to Vekro</h2>
          <p className="type-body-md text-text-muted">Use the phone number you signed up with.</p>
        </div>
        <Controller
          control={control}
          name="phone"
          render={({ field }) => (
            <PhoneField
              label="Phone number"
              autoComplete="username"
              error={formState.errors.phone?.message}
              disabled={locked}
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          )}
        />
        <div className="flex flex-col gap-2">
          <PasswordField
            label="Password"
            autoComplete="current-password"
            disabled={locked}
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <Link to="/forgot-password" className="type-body-sm self-end font-semibold text-primary">
            Forgot password?
          </Link>
        </div>
        <Button type="submit" fullWidth loading={submitting} disabled={locked}>
          Log in
        </Button>
        <p className="type-body-md text-center text-text-muted">
          New here?{' '}
          <Link to="/register" className="font-semibold text-primary">
            Create an account
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
