import { Controller } from 'react-hook-form'
import { Link } from 'react-router'
import type { LogInBanner } from '@/controllers/useLogIn'
import { usePasswordLogIn } from '@/controllers/usePasswordLogIn'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { Button } from '../../components/ui/Button'
import { PasswordField } from '../../components/ui/PasswordField'
import { PhoneField } from '../../components/ui/PhoneField'

/** The phone and password half of the one log in, loaded on demand (LogInPage). */
export function LogInPasswordForm({
  returnTo,
  onBanner,
}: {
  returnTo: string | null
  onBanner: (banner: LogInBanner) => void
}) {
  const p = usePasswordLogIn({ returnTo, onBanner })
  const { register, control, formState } = p.form
  const locked = p.lockedUntil !== null

  return (
    <form noValidate onSubmit={p.onSubmit} className="flex flex-col gap-5">
      {locked && (
        <div
          role="status"
          className="flex items-center gap-4 rounded-md border border-saffron-500/30 bg-saffron-50 p-4"
        >
          <CountdownRing
            deadline={p.lockedUntil ?? ''}
            totalMs={p.lockTotalMs}
            label="Log in again in"
            onExpire={p.onUnlock}
          />
          <div>
            <p className="type-body-md font-semibold text-saffron-700">Too many attempts.</p>
            <p className="type-body-sm text-ink-600">
              For your security, wait for the timer before trying again.
            </p>
          </div>
        </div>
      )}
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
      <Button type="submit" fullWidth loading={p.submitting} disabled={locked}>
        Log in
      </Button>
    </form>
  )
}

export default LogInPasswordForm
