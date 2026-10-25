import { ShieldCheck } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import { Controller } from 'react-hook-form'
import { Link } from 'react-router'
import { useLogIn, type LogInBanner } from '@/controllers/useLogIn'
import { duration } from '@/lib/motion'
import { CountdownRing } from '../../components/domain/CountdownRing'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { PasswordField } from '../../components/ui/PasswordField'
import { PhoneField } from '../../components/ui/PhoneField'

const BANNERS: Record<
  Exclude<LogInBanner, null>,
  { tone: 'info' | 'warning' | 'escalation' | 'danger'; title: string }
> = {
  expired: { tone: 'warning', title: 'Your session ended. Log in again to continue.' },
  reset: { tone: 'info', title: 'Password updated. Log in with your new password.' },
  'wrong-role': { tone: 'escalation', title: "This account doesn't have console access." },
  'wrong-details': { tone: 'danger', title: "That phone number and password don't match." },
  offline: { tone: 'danger', title: "You're offline. Check your connection and try again." },
  server: { tone: 'danger', title: "We couldn't log you in. Try again in a moment." },
}

/** A1 Admin log in (design/A1-admin-login). Route /admin/login. */
export function AdminLogInPage() {
  const reduce = useReducedMotion()
  const { form, onSubmit, submitting, banner, lockedUntil, lockTotalMs, onUnlock } = useLogIn('admin')
  const { register, control, formState } = form
  const locked = lockedUntil !== null

  return (
    <div className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-dark-background px-4 py-10 [color-scheme:dark]">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 size-[36rem] rounded-full bg-emerald-900/50 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -bottom-40 size-[36rem] rounded-full bg-plum-700/30 blur-3xl"
      />
      <motion.main
        initial={reduce ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: reduce ? 0 : duration.state }}
        className="relative flex w-full max-w-105 flex-col gap-4"
      >
        <form
          noValidate
          onSubmit={onSubmit}
          className="flex flex-col gap-5 rounded-xl bg-surface p-7 shadow-vault [color-scheme:light]"
        >
          <span className="grid size-12 place-items-center rounded-md bg-plum-500 text-sand-0">
            <ShieldCheck aria-hidden="true" className="size-6" />
          </span>
          <div>
            <h1 className="type-headline text-text">Vekro Support Console</h1>
            <p className="type-body-md text-text-muted">Authorized staff only</p>
          </div>
          {banner && <Banner tone={BANNERS[banner].tone} title={BANNERS[banner].title} />}
          {banner === 'wrong-role' && (
            <Link to="/login" className="type-body-md -mt-2 font-semibold text-primary">
              Go to the seller app
            </Link>
          )}
          {locked && (
            <div role="status" className="flex items-center gap-4 rounded-md bg-saffron-50 p-4">
              <CountdownRing
                deadline={lockedUntil}
                totalMs={lockTotalMs}
                label="Log in again in"
                onExpire={onUnlock}
              />
              <p className="type-body-md font-semibold text-saffron-700">
                Too many tries. Wait for the timer.
              </p>
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
          <PasswordField
            label="Password"
            autoComplete="current-password"
            disabled={locked}
            error={formState.errors.password?.message}
            {...register('password')}
          />
          <Button type="submit" variant="console" fullWidth loading={submitting} disabled={locked}>
            Log in
          </Button>
        </form>
        <p className="type-body-sm text-center text-dark-text-muted">All actions are logged.</p>
      </motion.main>
    </div>
  )
}
