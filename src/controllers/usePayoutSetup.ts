import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { payoutBreakdown } from '@/lib/fees'
import { maskPhone, toE164, toNationalDigits } from '@/lib/phone'
import { ApiError } from '@/models/api/errors'
import { useSaveSellerProfile } from '@/models/queries/sellerProfile'
import { AREAS, payoutSetupSchema, SHOP_FIELDS, type PayoutSetupValues } from '@/models/schemas/payout'
import { useSession } from './useSession'

export type PayoutStep = 'shop' | 'payout' | 'saved'

/** S3: shop details, then where payouts go, with a live fee example. */
export function usePayoutSetup() {
  const session = useSession()
  const user = session.status === 'authenticated' ? session.user : null
  const save = useSaveSellerProfile()
  const [step, setStep] = useState<PayoutStep>('shop')
  const [saleAmount, setSaleAmount] = useState(52_000)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(true)

  const form = useForm<PayoutSetupValues>({
    resolver: zodResolver(payoutSetupSchema),
    mode: 'onTouched',
    defaultValues: {
      shopName: '',
      area: AREAS[0],
      description: '',
      mpesaPhone: user ? toNationalDigits(user.mpesa_phone ?? user.phone) : '',
      confirmPhone: '',
      mpesaAccountName: user?.mpesa_account_name ?? user?.name.toUpperCase() ?? '',
    },
  })

  useEffect(() => () => void (logoUrl && URL.revokeObjectURL(logoUrl)), [logoUrl])

  // The session can arrive after the first render: pre-fill the payout number and name once it does.
  useEffect(() => {
    if (!user) return
    if (!form.getValues('mpesaPhone'))
      form.setValue('mpesaPhone', toNationalDigits(user.mpesa_phone ?? user.phone))
    if (!form.getValues('mpesaAccountName'))
      form.setValue('mpesaAccountName', user.mpesa_account_name ?? user.name.toUpperCase())
  }, [user, form])

  const next = async () => {
    if (await form.trigger([...SHOP_FIELDS])) setStep('payout')
  }

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null)
    try {
      const result = await save.mutateAsync({
        shopName: values.shopName,
        area: values.area,
        description: values.description,
        logoUrl,
        mpesaPhone: toE164(values.mpesaPhone),
        mpesaAccountName: values.mpesaAccountName,
      })
      setSaved(result.saved)
      setStep('saved')
    } catch (e) {
      setError(
        e instanceof ApiError && e.kind === 'network'
          ? "You're offline. Your details are still here; try again when you're connected."
          : "We couldn't save your details. Try again.",
      )
    }
  })

  const values = form.watch()
  return {
    form,
    step,
    next,
    back: () => setStep('shop'),
    onSubmit,
    saving: save.isPending,
    error,
    saved,
    signedInAs: user?.name ?? '',
    preview: {
      shopName: values.shopName || 'Your shop',
      area: values.area,
      description: values.description,
      logoUrl,
    },
    phonesMatch: values.confirmPhone.length === 9 && values.confirmPhone === values.mpesaPhone,
    maskedPayoutPhone: maskPhone(values.mpesaPhone),
    fee: {
      amount: saleAmount,
      setAmount: setSaleAmount,
      min: 500,
      max: 200_000,
      ...payoutBreakdown(saleAmount),
    },
    onLogo: (file: File | undefined) => setLogoUrl(file ? URL.createObjectURL(file) : null),
    areas: AREAS,
  }
}
