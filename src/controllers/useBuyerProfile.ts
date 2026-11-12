import { useState } from 'react'
import { isValidNational, maskPhone, toE164 } from '@/lib/phone'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { hasStore } from '@/models/domain/roleHome'
import {
  useChangePhone,
  useRequestPhoneChangeCode,
  useSetSmsLogin,
  useSetUssdPin,
  useUpdateName,
} from '@/models/queries/account'
import { useSession } from './useSession'

const offline = (e: unknown) => e instanceof ApiError && e.kind === 'network'

/** B12 Profile & security (design/B12-profile-security). Route /buyer/profile. */
export function useBuyerProfile() {
  const session = useSession()
  const user = session.status === 'authenticated' ? session.user : null
  const updateName = useUpdateName()
  const requestCode = useRequestPhoneChangeCode()
  const changePhone = useChangePhone()
  const smsLogin = useSetSmsLogin()
  const ussdPin = useSetUssdPin()

  const [name, setName] = useState<string | null>(null)
  const [phoneOpen, setPhoneOpen] = useState(false)
  const [phoneStep, setPhoneStep] = useState<'number' | 'code'>('number')
  const [newPhone, setNewPhone] = useState('')
  const [code, setCode] = useState('')
  const [phoneError, setPhoneError] = useState<string | null>(null)
  const [smsError, setSmsError] = useState<string | null>(null)
  const [pin, setPin] = useState('')
  const [pinPassword, setPinPassword] = useState('')
  const [pinError, setPinError] = useState<string | null>(null)

  const currentName = name ?? user?.name ?? ''

  const saveName = async () => {
    if (currentName.trim().length < 2) return
    try {
      await updateName.mutateAsync(currentName.trim())
      setName(null)
      toast.show('Name saved', 'success')
    } catch (e) {
      toast.show(offline(e) ? "You're offline. Try again." : "We couldn't save your name.", 'danger')
    }
  }

  const sendCode = async () => {
    setPhoneError(null)
    if (!isValidNational(newPhone)) return setPhoneError('Enter a Kenyan mobile number.')
    try {
      await requestCode.mutateAsync(toE164(newPhone))
      setCode('')
      setPhoneStep('code')
    } catch (e) {
      setPhoneError(
        e instanceof ApiError && e.kind === 'conflict'
          ? 'Another account already uses this number.'
          : e instanceof ApiError && e.kind === 'validation'
            ? 'That is already your number.'
            : e instanceof ApiError && e.kind === 'rate_limited'
              ? 'Too many codes. Wait a little, then try again.'
              : "We couldn't send a code. Try again.",
      )
    }
  }

  const confirmPhone = async (value: string) => {
    setPhoneError(null)
    try {
      await changePhone.mutateAsync({ phone: toE164(newPhone), code: value })
      setPhoneOpen(false)
      setPhoneStep('number')
      setNewPhone('')
      toast.show('Your sign-in number changed. Other devices were signed out.', 'success')
    } catch (e) {
      setCode('')
      setPhoneError(
        e instanceof ApiError && e.status === 410
          ? 'That code has expired. Send a new one.'
          : e instanceof ApiError && e.kind === 'validation'
            ? "That code doesn't match."
            : e instanceof ApiError && e.kind === 'rate_limited'
              ? 'Too many tries. Wait a little, then try again.'
              : "We couldn't change your number. Try again.",
      )
    }
  }

  const toggleSms = async (enabled: boolean) => {
    setSmsError(null)
    try {
      await smsLogin.mutateAsync(enabled)
      toast.show(enabled ? 'SMS-code sign-in is on' : 'SMS-code sign-in is off', 'success')
    } catch (e) {
      setSmsError(
        e instanceof ApiError && e.kind === 'conflict'
          ? 'Set a password or link Google first, so you can still sign in.'
          : "We couldn't change this. Try again.",
      )
    }
  }

  const savePin = async () => {
    setPinError(null)
    if (!/^\d{4}$/.test(pin)) return setPinError('The PIN is 4 digits.')
    if (!pinPassword) return setPinError('Enter your password to confirm.')
    try {
      await ussdPin.mutateAsync({ pin, password: pinPassword })
      setPin('')
      setPinPassword('')
      toast.show('USSD PIN saved', 'success')
    } catch (e) {
      setPinError(
        e instanceof ApiError && e.status === 403
          ? "That password doesn't match."
          : "We couldn't save your PIN.",
      )
    }
  }

  return {
    ready: Boolean(user),
    name: currentName,
    setName,
    nameDirty: name !== null && name.trim() !== user?.name,
    saveName: () => void saveName(),
    savingName: updateName.isPending,
    phoneMasked: user ? maskPhone(user.phone) : '',
    googleEmail: user?.google_email ?? null,
    hasPassword: user?.has_password !== false,
    phone: {
      open: phoneOpen,
      setOpen: (open: boolean) => {
        setPhoneOpen(open)
        if (!open) {
          setPhoneStep('number')
          setPhoneError(null)
        }
      },
      step: phoneStep,
      value: newPhone,
      setValue: setNewPhone,
      code,
      setCode,
      error: phoneError,
      send: () => void sendCode(),
      sending: requestCode.isPending,
      confirm: (value: string) => void confirmPhone(value),
      confirming: changePhone.isPending,
    },
    sms: {
      enabled: user?.sms_login_enabled !== false,
      toggle: (enabled: boolean) => void toggleSms(enabled),
      saving: smsLogin.isPending,
      error: smsError,
    },
    pin: {
      value: pin,
      setValue: (v: string) => setPin(v.replace(/\D/g, '').slice(0, 4)),
      password: pinPassword,
      setPassword: setPinPassword,
      error: pinError,
      save: () => void savePin(),
      saving: ussdPin.isPending,
    },
    hasStore: session.status === 'authenticated' && hasStore(session.account),
  }
}
