import { useState } from 'react'
import { useNavigate } from 'react-router'
import { destinationFor } from '@/models/domain/roleHome'
import {
  useCompleteGoogleSignup,
  usePendingGoogleSignup,
  useRequestGoogleSignupCode,
} from '@/models/queries/google'
import { usePhoneSignIn } from './usePhoneSignIn'

/**
 * /register/google: a Google account with no Vekro account yet becomes a member (no store; selling
 * starts later from the buyer area) only after an SMS-verified phone (backend #324, #338). A number
 * that already has an account is refused: sign in with it, then link Google in Profile & security.
 */
export function useGoogleSignUp() {
  const navigate = useNavigate()
  const pending = usePendingGoogleSignup()
  const [name, setName] = useState<string | null>(null)
  const typedName = name ?? pending.data?.name ?? ''
  const flow = usePhoneSignIn((user) => navigate(destinationFor(user ?? 'buyer', null), { replace: true }), {
    request: useRequestGoogleSignupCode(),
    verify: useCompleteGoogleSignup(() => typedName),
  })
  return {
    status: pending.isPending
      ? ('loading' as const)
      : pending.data
        ? ('ready' as const)
        : ('expired' as const),
    error: pending.isError,
    email: pending.data?.email ?? null,
    name: typedName,
    setName,
    flow,
  }
}
