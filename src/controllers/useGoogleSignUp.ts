import { useNavigate } from 'react-router'
import {
  useCompleteGoogleSignup,
  usePendingGoogleSignup,
  useRequestGoogleSignupCode,
} from '@/models/queries/google'
import { usePhoneSignIn } from './usePhoneSignIn'

/**
 * /register/google (#312): a Google account with no Vekro account yet becomes a seller only after an
 * SMS-verified phone (backend #324), so nobody sells or pays out unverified. Same phone and code
 * steps as the SMS sign-in.
 */
export function useGoogleSignUp() {
  const navigate = useNavigate()
  const pending = usePendingGoogleSignup()
  const flow = usePhoneSignIn(() => navigate('/onboarding', { replace: true }), {
    request: useRequestGoogleSignupCode(),
    verify: useCompleteGoogleSignup(),
  })
  return {
    status: pending.isPending
      ? ('loading' as const)
      : pending.data
        ? ('ready' as const)
        : ('expired' as const),
    error: pending.isError,
    email: pending.data?.email ?? null,
    name: pending.data?.name ?? null,
    flow,
  }
}
