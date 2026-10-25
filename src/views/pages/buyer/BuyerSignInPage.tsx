import { MessageSquareText, Smartphone } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link, Navigate } from 'react-router'
import { useBuyerSignIn, type SignInBanner } from '@/controllers/useBuyerSignIn'
import { duration } from '@/lib/motion'
import { Banner } from '../../components/ui/Banner'
import { Button } from '../../components/ui/Button'
import { CodeCells } from '../../components/ui/CodeCells'
import { PhoneField } from '../../components/ui/PhoneField'

const BANNERS: Record<Exclude<SignInBanner, null>, { tone: 'danger' | 'escalation'; title: string }> = {
  offline: { tone: 'danger', title: "You're offline. Connect and try again." },
  server: { tone: 'danger', title: "We couldn't sign you in. Try again in a moment." },
  seller: { tone: 'escalation', title: 'This number has a seller account. Log in with your password.' },
}

/** B8 Buyer sign-in (design/B8-buyer-sign-in). Route /buyer/sign-in. */
export function BuyerSignInPage() {
  const p = useBuyerSignIn()
  const reduce = useReducedMotion()
  const cells = useRef<HTMLDivElement>(null)

  // After a wrong or expired code the cells clear; put the cursor back in the first one.
  useEffect(() => {
    if (p.problem) cells.current?.querySelector('input')?.focus()
  }, [p.problem])

  if (p.redirect) return <Navigate to={p.redirect} replace />

  const slide = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
        transition: { duration: duration.state },
      }

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

      {p.banner && (
        <Banner
          tone={BANNERS[p.banner].tone}
          title={BANNERS[p.banner].title}
          action={
            p.banner === 'seller' ? (
              <Link to="/login" className="type-body-md font-semibold text-primary">
                Seller log in
              </Link>
            ) : undefined
          }
        />
      )}
      {p.locked && (
        <Banner tone="warning" title={`Too many tries. Try again in ${p.lockedFor}.`}>
          For your security, wait for the timer before asking for a new code.
        </Banner>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {p.step === 'phone' ? (
          <motion.form
            key="phone"
            {...slide}
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              p.send()
            }}
            className="flex flex-col gap-5"
          >
            <PhoneField
              label="Phone number"
              value={p.phone}
              onChange={p.setPhone}
              onBlur={p.onPhoneBlur}
              error={p.phoneError}
              disabled={p.locked}
            />
            <Button type="submit" fullWidth loading={p.sending} disabled={p.locked}>
              Send code
            </Button>
          </motion.form>
        ) : (
          <motion.div key="code" {...slide} className="flex flex-col gap-5">
            <p className="type-body-md text-text">
              Enter the 6-digit code we sent to{' '}
              <span className="type-mono whitespace-nowrap">{p.maskedPhone}</span>
            </p>
            <div ref={cells}>
              <CodeCells
                label="Sign-in code"
                value={p.code}
                onChange={p.setCode}
                onComplete={p.submitCode}
                disabled={p.verifying || p.locked}
                error={
                  p.problem === 'wrong'
                    ? "That code doesn't match. Check the SMS and try again."
                    : p.problem === 'expired'
                      ? 'That code has expired.'
                      : undefined
                }
              />
            </div>
            {p.verifying && (
              <p role="status" className="type-body-sm text-text-muted">
                Checking your code…
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {p.problem === 'expired' ? (
                <Button variant="secondary" onClick={p.resend} disabled={!p.canResend} loading={p.sending}>
                  Send a new code
                </Button>
              ) : p.resendIn ? (
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
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col items-center gap-2 pt-2 text-center">
        <Link to="/" className="type-body-md min-h-11 content-center font-semibold text-primary">
          Continue without an account
        </Link>
        <p className="type-body-sm text-text-muted">We only use your number to find your orders.</p>
      </div>
    </div>
  )
}
