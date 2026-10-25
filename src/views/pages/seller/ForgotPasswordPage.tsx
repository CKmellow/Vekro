import { Link } from 'react-router'
import { useAuthShowcase } from '@/controllers/useAuthShowcase'
import { useForgotPassword } from '@/controllers/useForgotPassword'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { CodeCells } from '../../components/ui/CodeCells'
import { PasswordField } from '../../components/ui/PasswordField'
import { PhoneField } from '../../components/ui/PhoneField'
import { AuthLayout } from '../../layouts/AuthLayout'

/** S2 "Forgot password?": reset by SMS code. Route /forgot-password. */
export function ForgotPasswordPage() {
  const vault = useAuthShowcase()
  const p = useForgotPassword()

  return (
    <AuthLayout headline="Locked out?" lead="We'll text you a code to set a new password." vault={vault}>
      <title>Reset password · Vekro</title>
      <div className="flex flex-col gap-5">
        {p.banner && (
          <Banner
            tone="danger"
            title={
              p.banner === 'offline'
                ? "You're offline. Connect and try again."
                : "We couldn't reset your password. Try again in a moment."
            }
          />
        )}
        {p.locked && (
          <Banner tone="warning" title={`Too many tries. Try again in ${p.lockedFor}.`}>
            For your security, wait for the timer before trying again.
          </Banner>
        )}
        <div className="flex flex-col gap-1">
          <h2 className="type-headline text-text">Reset your password</h2>
          <p className="type-body-md text-text-muted">
            {p.step === 'phone'
              ? 'Enter the phone number you log in with.'
              : `If ${p.maskedPhone} has a Vekro account, we've texted it a code.`}
          </p>
        </div>

        {p.step === 'phone' ? (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              p.send()
            }}
            className="flex flex-col gap-5"
          >
            <PhoneField
              label="Phone number"
              autoComplete="username"
              value={p.phone}
              onChange={p.setPhone}
              error={p.errors.phone}
            />
            <Button type="submit" fullWidth loading={p.sending} disabled={p.locked}>
              Send code
            </Button>
          </form>
        ) : (
          <form
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              p.submit()
            }}
            className="flex flex-col gap-5"
          >
            <CodeCells
              label="Reset code"
              value={p.code}
              onChange={p.setCode}
              disabled={p.locked}
              error={
                p.problem === 'wrong'
                  ? "That code doesn't match. Check the SMS and try again."
                  : p.problem === 'expired'
                    ? 'That code has expired. Send a new one.'
                    : p.errors.code
              }
            />
            <PasswordField
              label="New password"
              autoComplete="new-password"
              value={p.password}
              onChange={(e) => p.setPassword(e.target.value)}
              error={p.errors.password}
              strength={p.strength}
              rules={p.password ? p.rules : undefined}
            />
            <PasswordField
              label="Confirm new password"
              autoComplete="new-password"
              value={p.confirm}
              onChange={(e) => p.setConfirm(e.target.value)}
              error={p.errors.confirm}
            />
            <Button type="submit" fullWidth loading={p.resetting} disabled={p.locked}>
              Set new password
            </Button>
            <div className="flex flex-wrap items-center justify-between gap-3">
              {p.resendIn ? (
                <p className="type-body-md text-text-muted">
                  Resend in <span className="type-mono">{p.resendIn}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={p.resend}
                  disabled={!p.canResend}
                  className="type-body-md min-h-11 font-semibold text-primary disabled:text-ink-400"
                >
                  Resend code
                </button>
              )}
              <Button variant="ghost" onClick={p.changeNumber}>
                Use a different number
              </Button>
            </div>
            <p className="type-body-sm text-text-muted">Setting a new password signs you out everywhere.</p>
          </form>
        )}
        <p className="type-body-md text-center text-text-muted">
          Remembered it?{' '}
          <Link to="/login" className="font-semibold text-primary">
            Log in
          </Link>
        </p>
      </div>
    </AuthLayout>
  )
}
