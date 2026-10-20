import { zodResolver } from '@hookform/resolvers/zod'
import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useForm } from 'react-hook-form'
import { formatKes } from '@/lib/money'
import { passwordStrength, PASSWORD_RULES } from '@/lib/password'
import { maskPhone, toE164 } from '@/lib/phone'
import { ApiError } from '@/models/api/errors'
import { policySummary, type Listing, type Resolution } from '@/models/domain/listing'
import { useListing } from '@/models/queries/listings'
import { useCreateOrder } from '@/models/queries/orders'
import { useRegister, useSignIn, useSignOut } from '@/models/queries/session'
import { paySchema, type PayMode, type PayValues } from '@/models/schemas/auth'
import { useOnline } from './useOnline'
import { useSession } from './useSession'

export interface PayListingView {
  title: string
  price: number
  priceLabel: string
  photoUrls: string[]
  isSerialized: boolean
  description: string
  seller: { name: string; initials: string; meta: string }
  promise: { title: string; line: string }
  /** For a link meant for one buyer. */
  reservedFor: string | null
}

/** The seller's fix in buyer words (the seller-facing labels say what happens to the payout). */
const BUYER_FIX: Record<Resolution, string> = {
  refund: 'Refund',
  repair: 'Repair',
  replacement: 'Replacement',
}

const monthYear = new Intl.DateTimeFormat('en-GB', {
  month: 'short',
  year: 'numeric',
  timeZone: 'Africa/Nairobi',
})

export function initials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean)
  return (words.length > 1 ? `${words[0]?.[0]}${words[1]?.[0]}` : (words[0]?.slice(0, 2) ?? '')).toUpperCase()
}

/** What the buyer sees on B1, from the public listing. No invented data: no area, badge or fake counts. */
export function toPayListingView(listing: Listing): PayListingView {
  const { completedSales, memberSince } = listing.seller
  const since = `On Vekro since ${monthYear.format(new Date(memberSince))}`
  const resolution = listing.policy.resolution
  const offers = resolution && resolution !== 'refund' ? [BUYER_FIX[resolution], 'Refund'] : ['Refund']
  return {
    title: listing.title,
    price: listing.price,
    priceLabel: formatKes(listing.price),
    photoUrls: listing.photoUrls,
    isSerialized: listing.isSerialized,
    description: listing.description,
    seller: {
      name: listing.seller.name,
      initials: initials(listing.seller.name),
      meta:
        completedSales > 0
          ? `${completedSales} ${completedSales === 1 ? 'sale' : 'sales'} · ${since}`
          : since,
    },
    promise: listing.isSerialized
      ? {
          title: `Seller offers: ${offers.join(' · ')}`,
          line: 'You have 24 hours after delivery to report a problem.',
        }
      : {
          title: 'Check it at your door first',
          line: policySummary({ isSerialized: false, ...listing.policy }),
        },
    reservedFor: listing.buyerName,
  }
}

export type PayPageState = 'loading' | 'ready' | 'not_found' | 'error'

/** Who is paying: a form to fill, a signed-in buyer, or an account that cannot buy. */
export type PayIdentity =
  | { kind: 'form'; mode: Exclude<PayMode, 'signed_in'> }
  | { kind: 'buyer'; phoneMasked: string }
  | { kind: 'wrong_role' }
  | { kind: 'checking' }

/** B1: the public listing, the pay card form and the Pay action (docs/PAGES.md B1, FRONTEND_CONTRACT A and B). */
export function usePayPage(listingId: string) {
  const listing = useListing(listingId)
  const online = useOnline()
  const session = useSession()
  const register = useRegister()
  const signIn = useSignIn()
  const signOut = useSignOut()
  const createOrder = useCreateOrder()
  const navigate = useNavigate()
  // Guards the whole save-details-then-pay sequence against a second press.
  const submitting = useRef(false)
  const [termsOpen, setTermsOpen] = useState(false)
  const [formMode, setFormMode] = useState<'register' | 'login'>('register')
  const [notice, setNotice] = useState<string | null>(null)
  const [payError, setPayError] = useState<string | null>(null)
  const form = useForm<PayValues>({
    resolver: zodResolver(paySchema),
    defaultValues: { mode: 'register', phone: '', name: '', password: '', terms: false },
    mode: 'onTouched',
  })

  const identity: PayIdentity =
    session.status === 'loading'
      ? { kind: 'checking' }
      : session.status === 'authenticated'
        ? session.role === 'buyer'
          ? { kind: 'buyer', phoneMasked: maskPhone(session.user.mpesa_phone ?? session.user.phone) }
          : { kind: 'wrong_role' }
        : { kind: 'form', mode: formMode }

  const mode: PayMode = identity.kind === 'buyer' ? 'signed_in' : formMode
  useEffect(() => form.setValue('mode', mode), [form, mode])

  const state: PayPageState = listing.data
    ? 'ready'
    : listing.isPending
      ? 'loading'
      : listing.error instanceof ApiError && listing.error.kind === 'not_found'
        ? 'not_found'
        : 'error'

  const values = form.watch()
  const canPay =
    state === 'ready' &&
    online &&
    (identity.kind === 'buyer' || identity.kind === 'form') &&
    paySchema.safeParse({ ...values, mode }).success

  /** Signs the buyer in (or saves their details) when needed. Resolves false when the form shows why not. */
  async function ensureBuyer(v: PayValues): Promise<boolean> {
    if (v.mode === 'signed_in') return true
    const phone = toE164(v.phone)
    try {
      if (v.mode === 'register')
        await register.mutateAsync({
          name: v.name.trim(),
          phone,
          password: v.password,
          role: 'buyer',
          mpesaPhone: phone,
        })
      else await signIn.mutateAsync({ phone, password: v.password })
      return true
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'conflict') {
        setFormMode('login')
        form.setValue('password', '')
        setNotice('This number already has a Vekro account. Log in to pay.')
      } else if (error instanceof ApiError && (error.kind === 'unauthorized' || error.kind === 'forbidden')) {
        form.setError('password', { message: "Phone or password doesn't match. Check them and try again." })
      } else if (error instanceof ApiError && error.kind === 'validation') {
        for (const [field, message] of Object.entries(error.fieldErrors))
          if (field === 'phone' || field === 'name' || field === 'password') form.setError(field, { message })
      } else {
        setNotice(
          error instanceof ApiError && error.kind === 'network'
            ? "You're offline. Your details are still here."
            : "We couldn't save your details. Try again.",
        )
      }
      return false
    }
  }

  /** POST /transactions with the listing only; 201 and 202 both continue to B2 (contract B). */
  async function startPayment() {
    try {
      const order = await createOrder.mutateAsync(listingId)
      navigate(`/order/${order.id}/payment`)
    } catch (error) {
      const kind = error instanceof ApiError ? error.kind : null
      if (kind === 'validation' || kind === 'conflict') void listing.refetch()
      setPayError(
        kind === 'validation'
          ? error instanceof ApiError && error.message
            ? error.message
            : 'This item can no longer be paid for.'
          : kind === 'not_found'
            ? 'This item is no longer available.'
            : kind === 'network'
              ? "You're offline. Nothing was charged. Try again when you're connected."
              : "We couldn't start the payment. Nothing was charged. Try again.",
      )
    }
  }

  const onPay = form.handleSubmit(async (v) => {
    if (submitting.current) return
    submitting.current = true
    setNotice(null)
    setPayError(null)
    try {
      if (await ensureBuyer(v)) await startPayment()
    } finally {
      submitting.current = false
    }
  })

  return {
    state,
    listing: listing.data ? toPayListingView(listing.data) : null,
    retry: () => void listing.refetch(),
    online,
    form,
    identity,
    switchMode: () => {
      setNotice(null)
      setFormMode((m) => (m === 'register' ? 'login' : 'register'))
    },
    notYou: () => signOut.mutate(),
    notice,
    // S1 rules under "Create a password" (register only).
    passwordHints:
      mode === 'register'
        ? {
            strength: passwordStrength(values.password),
            rules: PASSWORD_RULES.map((rule) => ({
              id: rule.id,
              label: rule.label,
              met: rule.test(values.password),
            })),
          }
        : null,
    canPay,
    onPay,
    payError,
    paying: register.isPending || signIn.isPending || createOrder.isPending,
    termsOpen,
    setTermsOpen,
  }
}
export type { PayValues }
