import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router'
import { destinationFor } from '@/models/domain/roleHome'
import { usePhoneSignIn } from './usePhoneSignIn'
import { useSession } from './useSession'

export type LogInBanner = 'expired' | 'reset' | 'wrong-details' | 'offline' | 'server' | null
export type LogInMethod = 'password' | 'code'

/**
 * One log in for everyone (Cyprian, 2026-11-07): phone and password for buyers, sellers and admins
 * (usePasswordLogIn), or an SMS code for buyers. Each role lands in its own area, or back on the
 * page it was sent away from when that page is in its area. Someone already signed in goes there.
 */
export function useLogIn() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const session = useSession()
  const returnTo = params.get('returnTo')
  const [method, setMethod] = useState<LogInMethod>(params.get('method') === 'code' ? 'code' : 'password')
  const [banner, setBanner] = useState<LogInBanner>(
    params.get('reason') === 'expired' ? 'expired' : params.get('reason') === 'reset' ? 'reset' : null,
  )
  const code = usePhoneSignIn(() => navigate(destinationFor('buyer', returnTo), { replace: true }))

  return {
    method,
    setMethod: (next: LogInMethod) => {
      setMethod(next)
      if (banner !== 'expired') setBanner(null)
    },
    banner,
    onBanner: setBanner,
    returnTo,
    code,
    /** Already signed in: where to go. */
    redirect: session.status === 'authenticated' ? destinationFor(session.role, returnTo) : null,
  }
}
