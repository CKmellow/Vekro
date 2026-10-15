import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { passwordStrength, PASSWORD_RULES } from '@/lib/password'
import { toE164 } from '@/lib/phone'
import { ApiError } from '@/models/api/errors'
import { useRegister } from '@/models/queries/session'
import { signUpSchema, type SignUpValues } from '@/models/schemas/auth'

const defaults: SignUpValues = {
  name: '',
  phone: '',
  shopName: '',
  password: '',
  confirmPassword: '',
  terms: false,
}

/** S1: create a seller account, sign in, then go to payout setup (S3). */
export function useSignUp() {
  const navigate = useNavigate()
  const register = useRegister()
  const [serverError, setServerError] = useState<string | null>(null)
  const [phoneTaken, setPhoneTaken] = useState(false)
  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: defaults,
    mode: 'onTouched',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null)
    setPhoneTaken(false)
    try {
      // Shop name waits for backend-gap #144 (seller profile); the API takes name, phone, password and role.
      await register.mutateAsync({
        name: values.name,
        phone: toE164(values.phone),
        password: values.password,
        role: 'seller',
      })
      navigate('/onboarding', { replace: true })
    } catch (error) {
      if (error instanceof ApiError && error.kind === 'conflict') {
        setPhoneTaken(true)
        form.setError('phone', { message: 'This number already has a Vekro account.' })
      } else if (
        error instanceof ApiError &&
        error.kind === 'validation' &&
        Object.keys(error.fieldErrors).length
      ) {
        for (const [field, message] of Object.entries(error.fieldErrors)) {
          if (field in defaults) form.setError(field as keyof SignUpValues, { message })
        }
      } else if (error instanceof ApiError && error.kind === 'network') {
        setServerError("You're offline. Check your connection; your details are still here.")
      } else {
        setServerError('Something went wrong on our side. Your details are still here. Try again.')
      }
    }
  })

  const password = form.watch('password')
  return {
    form,
    onSubmit,
    submitting: register.isPending,
    serverError,
    phoneTaken,
    strength: passwordStrength(password),
    rules: PASSWORD_RULES.map((rule) => ({ id: rule.id, label: rule.label, met: rule.test(password) })),
  }
}
