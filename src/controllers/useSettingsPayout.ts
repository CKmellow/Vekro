import { useState } from 'react'
import { isValidNational, maskPhone, PHONE_ERROR, toE164, toNationalDigits } from '@/lib/phone'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { useChangePayout, useRequestPayoutCode, useSellerProfile } from '@/models/queries/sellerProfile'
import { useNow } from './useNow'
import { useOnline } from './useOnline'
import { clock } from './usePhoneSignIn'

export type PayoutStep = 'view' | 'enter' | 'code'

/** S13 Payout tab: the masked number, and a change confirmed by an SMS code sent to the new number. */
export function useSettingsPayout() {
  const online = useOnline()
  const query = useSellerProfile()
  const requestCode = useRequestPayoutCode()
  const change = useChangePayout()
  const profile = query.data
  const [step, setStep] = useState<PayoutStep>('view')
  const [phone, setPhone] = useState('')
  const [confirm, setConfirm] = useState('')
  const [name, setName] = useState('')
  const [tried, setTried] = useState(false)
  const [code, setCode] = useState('')
  const [problem, setProblem] = useState<'wrong' | 'expired' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [resendAt, setResendAt] = useState<number | null>(null)
  const [lockedAt, setLockedAt] = useState<number | null>(null)
  const now = useNow(resendAt !== null || lockedAt !== null)

  const current = profile ? toNationalDigits(profile.mpesaPhone) : ''
  const errors = {
    phone: !isValidNational(phone)
      ? PHONE_ERROR
      : phone === current
        ? 'This is already your payout number'
        : undefined,
    confirm: confirm !== phone ? "The numbers don't match. Check the last digits." : undefined,
    name: name.trim().length < 2 ? 'Enter the name on the M-Pesa account' : undefined,
  }
  const locked = lockedAt !== null && lockedAt > now
  const resendWait = resendAt !== null && resendAt > now ? resendAt - now : 0

  const fail = (e: unknown) => {
    if (e instanceof ApiError && e.kind === 'rate_limited') {
      setLockedAt(Date.now() + (e.retryAfterSeconds ?? 300) * 1000)
    } else if (e instanceof ApiError && e.kind === 'network') {
      setError("You're offline. Connect and try again.")
    } else setError("We couldn't change your payout number. Try again.")
  }

  const finish = () => {
    setStep('view')
    setCode('')
    setTried(false)
    toast.show('Payout number updated', 'success')
  }

  const send = async () => {
    setTried(true)
    setError(null)
    setProblem(null)
    if (errors.phone || errors.confirm || errors.name || !profile) return
    try {
      if (!profile.hasOrders) {
        // Before the first order no money can move, so no code is needed.
        await change.mutateAsync({ mpesaPhone: toE164(phone), mpesaAccountName: name.trim() })
        return finish()
      }
      const sent = await requestCode.mutateAsync(toE164(phone))
      setResendAt(Date.now() + sent.resendAfterSeconds * 1000)
      setCode('')
      setStep('code')
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'rate_limited' && (e.retryAfterSeconds ?? 300) <= 60) {
        setResendAt(Date.now() + (e.retryAfterSeconds ?? 30) * 1000)
        setStep('code')
      } else fail(e)
    }
  }

  const submitCode = async (value: string) => {
    if (change.isPending || locked) return
    setProblem(null)
    setError(null)
    try {
      await change.mutateAsync({ mpesaPhone: toE164(phone), mpesaAccountName: name.trim(), code: value })
      finish()
    } catch (e) {
      setCode('')
      if (e instanceof ApiError && e.kind === 'validation') setProblem('wrong')
      else if (e instanceof ApiError && e.status === 410) setProblem('expired')
      else fail(e)
    }
  }

  return {
    state: profile ? ('ready' as const) : query.isError ? ('error' as const) : ('loading' as const),
    retry: () => void query.refetch(),
    maskedCurrent: profile ? maskPhone(profile.mpesaPhone) : '',
    accountName: profile?.mpesaAccountName ?? '',
    step,
    start: () => {
      setPhone('')
      setConfirm('')
      setName(profile?.mpesaAccountName ?? '')
      setTried(false)
      setError(null)
      setStep('enter')
    },
    cancel: () => {
      setStep('view')
      setError(null)
      setProblem(null)
    },
    phone,
    setPhone,
    confirm,
    setConfirm,
    name,
    setName,
    errors: tried ? errors : ({} as Partial<typeof errors>),
    needsCode: profile?.hasOrders ?? true,
    send: () => void send(),
    sending: requestCode.isPending || (change.isPending && step === 'enter'),
    maskedNew: maskPhone(phone),
    code,
    setCode: (v: string) => {
      setCode(v)
      if (v) setProblem(null)
    },
    submitCode: (v: string) => void submitCode(v),
    verifying: change.isPending && step === 'code',
    problem,
    resendIn: resendWait > 0 ? clock(resendWait) : null,
    canResend: resendWait === 0 && !requestCode.isPending && !locked,
    resend: () => void send(),
    locked,
    lockedFor: locked && lockedAt !== null ? clock(lockedAt - now) : null,
    error,
    online,
  }
}
