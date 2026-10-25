import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router'
import { toE164 } from '@/lib/phone'
import { safeReturnTo } from '@/lib/returnTo'
import { ApiError } from '@/models/api/errors'
import { useSignIn, useSignOut } from '@/models/queries/session'
import { logInSchema, type LogInValues } from '@/models/schemas/auth'
import { useSession } from './useSession'

export type LogInBanner = 'expired' | 'wrong-role' | 'wrong-details' | 'offline' | 'server' | null

const HOME = { seller: '/seller', admin: '/admin' } as const

/**
 * S2 seller log in, and A1 for the support console (`role: 'admin'`). Returns to the page the person was
 * sent away from, inside their own area only. A wrong-role login at the console is signed out again.
 */
export function useLogIn(role: 'seller' | 'admin' = 'seller') {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const session = useSession()
  const signIn = useSignIn()
  const signOut = useSignOut()
  const [banner, setBanner] = useState<LogInBanner>(params.get('reason') === 'expired' ? 'expired' : null)
  const [lockedUntil, setLockedUntil] = useState<string | null>(null)
  const form = useForm<LogInValues>({
    resolver: zodResolver(logInSchema),
    defaultValues: { phone: '', password: '' },
    mode: 'onTouched',
  })

  const wrongRole = session.status === 'authenticated' && session.role !== role

  const onSubmit = form.handleSubmit(async (values) => {
    setBanner(null)
    try {
      const user = await signIn.mutateAsync({ phone: toE164(values.phone), password: values.password })
      if (user.role !== role) {
        if (role === 'admin') await signOut.mutateAsync().catch(() => undefined)
        return setBanner('wrong-role')
      }
      const back = safeReturnTo(params.get('returnTo'), HOME[role])
      navigate(back.startsWith(HOME[role]) ? back : HOME[role], { replace: true })
    } catch (error) {
      if (!(error instanceof ApiError)) return setBanner('server')
      if (error.kind === 'rate_limited') {
        // Retry-After is relative, so the device clock is fine for this one countdown.
        setLockedUntil(new Date(Date.now() + (error.retryAfterSeconds ?? 300) * 1000).toISOString())
      } else if (error.kind === 'unauthorized') {
        setBanner('wrong-details')
        form.setValue('password', '')
        form.setFocus('password')
      } else if (error.kind === 'network') setBanner('offline')
      else setBanner('server')
    }
  })

  return {
    form,
    onSubmit,
    submitting: signIn.isPending,
    banner: wrongRole && !banner ? 'wrong-role' : banner,
    lockedUntil,
    lockTotalMs: 5 * 60_000,
    onUnlock: () => setLockedUntil(null),
  }
}
