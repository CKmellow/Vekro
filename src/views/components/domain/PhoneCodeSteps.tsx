import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useEffect, useRef } from 'react'
import { Link } from 'react-router'
import type { PhoneSignIn, SignInBanner } from '@/controllers/usePhoneSignIn'
import { duration } from '@/lib/motion'
import { Banner } from '../ui/Banner'
import { Button } from '../ui/Button'
import { CodeCells } from '../ui/CodeCells'
import { PhoneField } from '../ui/PhoneField'

const BANNERS: Record<Exclude<SignInBanner, null>, { tone: 'danger' | 'escalation'; title: string }> = {
  offline: { tone: 'danger', title: "You're offline. Connect and try again." },
  server: { tone: 'danger', title: "We couldn't sign you in. Try again in a moment." },
  seller: { tone: 'escalation', title: 'This number has a seller account. Log in with your password.' },
}

/**
 * Phone step, then the 6-digit SMS code (B8 and the B3 phone gate). The steps slide (220ms, instant
 * under reduced motion); a wrong code shakes the cells and puts the cursor back in the first one.
 */
export function PhoneCodeSteps({ flow, sendLabel = 'Send code' }: { flow: PhoneSignIn; sendLabel?: string }) {
  const reduce = useReducedMotion()
  const cells = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (flow.problem) cells.current?.querySelector('input')?.focus()
  }, [flow.problem])

  const slide = reduce
    ? { initial: false as const, animate: { opacity: 1 }, exit: { opacity: 0 }, transition: { duration: 0 } }
    : {
        initial: { opacity: 0, x: 24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
        transition: { duration: duration.state },
      }

  return (
    <>
      {flow.banner && (
        <Banner
          tone={BANNERS[flow.banner].tone}
          title={BANNERS[flow.banner].title}
          action={
            flow.banner === 'seller' ? (
              <Link to="/login" className="type-body-md font-semibold text-primary">
                Seller log in
              </Link>
            ) : undefined
          }
        />
      )}
      {flow.locked && (
        <Banner tone="warning" title={`Too many tries. Try again in ${flow.lockedFor}.`}>
          For your security, wait for the timer before asking for a new code.
        </Banner>
      )}

      <AnimatePresence mode="wait" initial={false}>
        {flow.step === 'phone' ? (
          <motion.form
            key="phone"
            {...slide}
            noValidate
            onSubmit={(e) => {
              e.preventDefault()
              flow.send()
            }}
            className="flex flex-col gap-5"
          >
            <PhoneField
              label="Phone number"
              value={flow.phone}
              onChange={flow.setPhone}
              onBlur={flow.onPhoneBlur}
              error={flow.phoneError}
              disabled={flow.locked}
            />
            <Button type="submit" fullWidth loading={flow.sending} disabled={flow.locked}>
              {sendLabel}
            </Button>
          </motion.form>
        ) : (
          <motion.div key="code" {...slide} className="flex flex-col gap-5">
            <p className="type-body-md text-text">
              Enter the 6-digit code we sent to{' '}
              <span className="type-mono whitespace-nowrap">{flow.maskedPhone}</span>
            </p>
            <div ref={cells}>
              <CodeCells
                label="Sign-in code"
                value={flow.code}
                onChange={flow.setCode}
                onComplete={flow.submitCode}
                disabled={flow.verifying || flow.locked}
                error={
                  flow.problem === 'wrong'
                    ? "That code doesn't match. Check the SMS and try again."
                    : flow.problem === 'expired'
                      ? 'That code has expired.'
                      : undefined
                }
              />
            </div>
            {flow.verifying && (
              <p role="status" className="type-body-sm text-text-muted">
                Checking your code…
              </p>
            )}
            <div className="flex flex-wrap items-center justify-between gap-3">
              {flow.problem === 'expired' ? (
                <Button
                  variant="secondary"
                  onClick={flow.resend}
                  disabled={!flow.canResend}
                  loading={flow.sending}
                >
                  Send a new code
                </Button>
              ) : flow.resendIn ? (
                <p className="type-body-md text-text-muted">
                  Resend in <span className="type-mono">{flow.resendIn}</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={flow.resend}
                  disabled={!flow.canResend}
                  className="type-body-md min-h-11 font-semibold text-primary disabled:text-ink-400"
                >
                  Resend code
                </button>
              )}
              <Button variant="ghost" onClick={flow.changeNumber}>
                Use a different number
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
