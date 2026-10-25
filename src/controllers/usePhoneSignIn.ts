import { useState } from 'react'
import { isValidNational, maskPhone, PHONE_ERROR, toE164 } from '@/lib/phone'
import { ApiError } from '@/models/api/errors'
import { useRequestPhoneCode, useVerifyPhoneCode } from '@/models/queries/session'
import { useNow } from './useNow'

export type SignInBanner = 'offline' | 'server' | 'seller' | null
export type CodeProblem = 'wrong' | 'expired' | null

/** A 429 this short on "Send code" is the resend cooldown: a code is already on its way. */
const COOLDOWN_MAX_SECONDS = 60

/** "0:28" from milliseconds, rounding up so the timer never shows 0:00 while still waiting. */
export function clock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}

/**
 * Sign in with an SMS code, no password (backend #201): phone step, code step, resend timer, wrong,
 * expired, locked, seller number and offline. Used by B8 and the B3 phone gate.
 */
export function usePhoneSignIn(onSignedIn: () => void) {
  const request = useRequestPhoneCode()
  const verify = useVerifyPhoneCode()
  const [step, setStep] = useState<'phone' | 'code'>('phone')
  const [phone, setPhone] = useState('')
  const [phoneTouched, setPhoneTouched] = useState(false)
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState<CodeProblem>(null)
  const [banner, setBanner] = useState<SignInBanner>(null)
  // Relative server waits (Retry-After, resend cooldown), so the device clock is fine for these timers.
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [lockedAt, setLockedAt] = useState<number | null>(null)
  const now = useNow(resendAt !== null || lockedAt !== null)

  const phoneValid = isValidNational(phone)
  const locked = lockedAt !== null && lockedAt > now
  const resendWait = resendAt !== null && resendAt > now ? resendAt - now : 0

  const fail = (error: unknown) => {
    if (error instanceof ApiError && error.kind === 'network') setBanner('offline')
    else setBanner('server')
  }

  const send = async () => {
    setPhoneTouched(true)
    if (!phoneValid || locked) return
    setBanner(null)
    setProblem(null)
    try {
      const sent = await request.mutateAsync(toE164(phone))
      setResendAt(Date.now() + sent.resendAfterSeconds * 1000)
      setCode('')
      setStep('code')
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'rate_limited') {
        const wait = error.retryAfterSeconds ?? 300
        if (wait <= COOLDOWN_MAX_SECONDS && step === 'phone') {
          // A code went out moments ago: go and enter it.
          setResendAt(Date.now() + wait * 1000)
          setStep('code')
        } else if (wait <= COOLDOWN_MAX_SECONDS) setResendAt(Date.now() + wait * 1000)
        else setLockedAt(Date.now() + wait * 1000)
      } else fail(error)
    }
  }

  const submitCode = async (value: string) => {
    if (verify.isPending || locked) return
    setBanner(null)
    setProblem(null)
    try {
      await verify.mutateAsync({ phone: toE164(phone), code: value })
      onSignedIn()
    } catch (error) {
      setCode('')
      if (!(error instanceof ApiError)) return setBanner('server')
      if (error.kind === 'validation') setProblem('wrong')
      else if (error.status === 410) setProblem('expired')
      else if (error.kind === 'rate_limited')
        setLockedAt(Date.now() + (error.retryAfterSeconds ?? 300) * 1000)
      else if (error.kind === 'conflict') setBanner('seller')
      else fail(error)
    }
  }

  return {
    step,
    phone,
    setPhone: (value: string) => {
      setPhone(value)
      setBanner(null)
    },
    onPhoneBlur: () => setPhoneTouched(true),
    phoneError: phoneTouched && !phoneValid ? PHONE_ERROR : undefined,
    send: () => void send(),
    sending: request.isPending,
    maskedPhone: maskPhone(phone),
    code,
    setCode: (value: string) => {
      setCode(value)
      if (value) setProblem(null)
    },
    submitCode: (value: string) => void submitCode(value),
    verifying: verify.isPending,
    problem,
    canResend: step === 'code' && resendWait === 0 && !request.isPending && !locked,
    resendIn: resendWait > 0 ? clock(resendWait) : null,
    resend: () => void send(),
    changeNumber: () => {
      setStep('phone')
      setCode('')
      setProblem(null)
      setBanner(null)
    },
    banner,
    locked,
    lockedFor: locked && lockedAt !== null ? clock(lockedAt - now) : null,
  }
}

export type PhoneSignIn = ReturnType<typeof usePhoneSignIn>
