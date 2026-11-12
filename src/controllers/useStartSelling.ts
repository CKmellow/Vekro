import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { writeMode } from '@/lib/mode'
import { isValidNational, toE164, toNationalDigits } from '@/lib/phone'
import { ApiError } from '@/models/api/errors'
import { AREAS } from '@/models/schemas/payout'
import { useChangePayout, useRequestPayoutCode } from '@/models/queries/sellerProfile'
import { useStartSelling as useStartSellingMutation } from '@/models/queries/store'
import { useSession } from './useSession'

export type StartSellingStep = 'store' | 'payout' | 'code'

const offline = (e: unknown) => e instanceof ApiError && e.kind === 'network'

/**
 * S15 Start selling (design/S15-start-selling). Route /buyer/start-selling. Step 1 opens the store
 * (name, area, seller terms); step 2 proves the payout number with an SMS code (a store takes orders
 * only then); then S7 creates the first listing. Coming back resumes at the payout number.
 */
export function useStartSelling() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const session = useSession()
  const user = session.status === 'authenticated' ? session.user : null
  const store = user?.store
  const open = useStartSellingMutation()
  const requestCode = useRequestPayoutCode()
  const changePayout = useChangePayout()

  const resumeAtPayout = store?.status === 'active' || params.get('step') === 'payout'
  const [step, setStep] = useState<StartSellingStep>(resumeAtPayout ? 'payout' : 'store')
  const [shopName, setShopName] = useState('')
  const [area, setArea] = useState('')
  const [terms, setTerms] = useState(false)
  const [tried, setTried] = useState(false)
  const [payoutPhone, setPayoutPhone] = useState<string | null>(null)
  const [accountName, setAccountName] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)

  const phone = payoutPhone ?? (user ? toNationalDigits(user.mpesa_phone ?? user.phone) : '')
  const holder = accountName ?? user?.name ?? ''
  const storeErrors = {
    shopName: shopName.trim().length < 2 ? 'Give your store a name' : undefined,
    terms: terms ? undefined : 'Accept the seller terms to open a store',
  }

  const openStore = async () => {
    setTried(true)
    setError(null)
    if (storeErrors.shopName || storeErrors.terms) return
    try {
      await open.mutateAsync({ shopName, shopArea: area || undefined })
      writeMode('selling')
      setStep('payout')
    } catch (e) {
      if (e instanceof ApiError && e.kind === 'conflict') return navigate('/seller', { replace: true })
      setError(
        offline(e)
          ? "You're offline. Try again when you're connected."
          : "We couldn't open your store. Try again.",
      )
    }
  }

  const sendCode = async () => {
    setError(null)
    if (!isValidNational(phone)) return setError('Enter the M-Pesa number to pay you on.')
    if (holder.trim().length < 2) return setError('Enter the name on the M-Pesa account.')
    try {
      await requestCode.mutateAsync(toE164(phone))
      setCode('')
      setStep('code')
    } catch (e) {
      setError(
        e instanceof ApiError && e.kind === 'rate_limited'
          ? 'Too many codes. Wait a little, then try again.'
          : "We couldn't send a code. Try again.",
      )
    }
  }

  const confirm = async (value: string) => {
    setError(null)
    try {
      await changePayout.mutateAsync({
        mpesaPhone: toE164(phone),
        mpesaAccountName: holder.trim(),
        code: value,
      })
      writeMode('selling')
      navigate('/seller/listings/new?first=1', { replace: true })
    } catch (e) {
      setCode('')
      setError(
        e instanceof ApiError && e.status === 410
          ? 'That code has expired. Send a new one.'
          : e instanceof ApiError && e.kind === 'validation'
            ? "That code doesn't match."
            : e instanceof ApiError && e.kind === 'rate_limited'
              ? 'Too many tries. Wait a little, then try again.'
              : "We couldn't save your payout number. Try again.",
      )
    }
  }

  return {
    redirect: session.status === 'authenticated' && store?.status === 'closed' ? '/seller/settings' : null,
    step,
    stepIndex: step === 'store' ? 0 : 1,
    areas: AREAS,
    shopName,
    setShopName,
    area,
    setArea,
    terms,
    setTerms,
    errors: tried ? storeErrors : ({} as Partial<typeof storeErrors>),
    openStore: () => void openStore(),
    opening: open.isPending,
    phone,
    setPhone: setPayoutPhone,
    holder,
    setHolder: setAccountName,
    sendCode: () => void sendCode(),
    sending: requestCode.isPending,
    code,
    setCode,
    confirm: (value: string) => void confirm(value),
    confirming: changePayout.isPending,
    back: () => setStep('payout'),
    error,
  }
}
