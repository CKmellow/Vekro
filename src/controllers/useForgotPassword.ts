import { useState } from 'react'
import { useNavigate } from 'react-router'
import { PASSWORD_RULES, passwordStrength } from '@/lib/password'
import { isValidNational, maskPhone, PHONE_ERROR, toE164 } from '@/lib/phone'
import { ApiError } from '@/models/api/errors'
import { useRequestResetCode, useResetPassword } from '@/models/queries/account'
import { useNow } from './useNow'
import { clock } from './usePhoneSignIn'

/** S2 "Forgot password?" (backend #207): a code by SMS, then a new password. Signs out every device. */
export function useForgotPassword() {
  const navigate = useNavigate()
  const request = useRequestResetCode()
  const reset = useResetPassword()
  const [step, setStep] = useState<'phone' | 'reset'>('phone')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [tried, setTried] = useState(false)
  const [problem, setProblem] = useState<'wrong' | 'expired' | null>(null)
  const [banner, setBanner] = useState<'offline' | 'server' | null>(null)
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [lockedAt, setLockedAt] = useState<number | null>(null)
  const now = useNow(resendAt !== null || lockedAt !== null)
  const locked = lockedAt !== null && lockedAt > now
  const resendWait = resendAt !== null && resendAt > now ? resendAt - now : 0

  const errors = {
    phone: isValidNational(phone) ? undefined : PHONE_ERROR,
    code: /^\d{6}$/.test(code) ? undefined : 'Enter the 6-digit code',
    password: PASSWORD_RULES.every((r) => r.test(password))
      ? undefined
      : 'Use 8 or more characters with a letter and a number',
    confirm: confirm === password ? undefined : "Passwords don't match",
  }

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.kind === 'rate_limited')
      setLockedAt(Date.now() + (e.retryAfterSeconds ?? 300) * 1000)
    else setBanner(e instanceof ApiError && e.kind === 'network' ? 'offline' : 'server')
  }

  const send = async () => {
    setBanner(null)
    if (errors.phone) return setTried(true)
    try {
      const sent = await request.mutateAsync(toE164(phone))
      setResendAt(Date.now() + sent.resendAfterSeconds * 1000)
      setStep('reset')
      setTried(false)
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'rate_limited' && (e.retryAfterSeconds ?? 300) <= 60) {
        setResendAt(Date.now() + (e.retryAfterSeconds ?? 30) * 1000)
        setStep('reset')
      } else fail(e)
    }
  }

  const submit = async () => {
    setTried(true)
    setBanner(null)
    setProblem(null)
    if (errors.code || errors.password || errors.confirm) return
    try {
      await reset.mutateAsync({ phone: toE164(phone), code, password })
      navigate('/login?reason=reset', { replace: true })
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'validation' && !Object.keys(e.fieldErrors).length) {
        setProblem('wrong')
        setCode('')
      } else if (e instanceof ApiError && e.status === 410) {
        setProblem('expired')
        setCode('')
      } else fail(e)
    }
  }

  return {
    step,
    phone,
    setPhone,
    maskedPhone: maskPhone(phone),
    send: () => void send(),
    sending: request.isPending,
    code,
    setCode: (v: string) => {
      setCode(v)
      if (v) setProblem(null)
    },
    password,
    setPassword,
    confirm,
    setConfirm,
    strength: password ? passwordStrength(password) : undefined,
    rules: PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, met: r.test(password) })),
    errors: tried ? errors : ({} as Partial<typeof errors>),
    problem,
    submit: () => void submit(),
    resetting: reset.isPending,
    resendIn: resendWait > 0 ? clock(resendWait) : null,
    canResend: resendWait === 0 && !request.isPending && !locked,
    resend: () => void send(),
    changeNumber: () => {
      setStep('phone')
      setCode('')
      setProblem(null)
    },
    banner,
    locked,
    lockedFor: locked && lockedAt !== null ? clock(lockedAt - now) : null,
  }
}
