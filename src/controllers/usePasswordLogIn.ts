import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router'
import { toE164 } from '@/lib/phone'
import { destinationFor } from '@/models/domain/roleHome'
import { ApiError } from '@/models/api/errors'
import { useSignIn } from '@/models/queries/session'
import { logInSchema, type LogInValues } from '@/models/schemas/auth'
import type { LogInBanner } from './useLogIn'

/**
 * The phone and password form of the one log in, for every role. Loaded on its own (form and
 * validation libraries), so a buyer who arrives on the SMS code never downloads it.
 */
export function usePasswordLogIn({
  returnTo,
  onBanner,
}: {
  returnTo: string | null
  onBanner: (banner: LogInBanner) => void
}) {
  const navigate = useNavigate()
  const signIn = useSignIn()
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)
  const form = useForm<LogInValues>({
    resolver: zodResolver(logInSchema),
    defaultValues: { phone: '', password: '' },
    mode: 'onTouched',
  })

  const onSubmit = form.handleSubmit(async (values) => {
    onBanner(null)
    try {
      const user = await signIn.mutateAsync({ phone: toE164(values.phone), password: values.password })
      navigate(destinationFor(user.role, returnTo), { replace: true })
    } catch (error) {
      if (!(error instanceof ApiError)) return onBanner('server')
      if (error.kind === 'rate_limited') {
        // Retry-After is relative, so the device clock is fine for this one countdown.
        setLockedUntil(new Date(Date.now() + (error.retryAfterSeconds ?? 300) * 1000).toISOString())
      } else if (error.kind === 'unauthorized') {
        onBanner('wrong-details')
        form.setValue('password', '')
        form.setFocus('password')
      } else if (error.kind === 'network') onBanner('offline')
      else onBanner('server')
    }
  })

  return {
    form,
    onSubmit,
    submitting: signIn.isPending,
    lockedUntil,
    lockTotalMs: 5 * 60_000,
    onUnlock: () => setLockedUntil(null),
  }
}
