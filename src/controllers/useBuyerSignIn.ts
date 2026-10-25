import { useNavigate, useSearchParams } from 'react-router'
import { safeReturnTo } from '@/lib/returnTo'
import { usePhoneSignIn } from './usePhoneSignIn'
import { useSession } from './useSession'

export { clock, type CodeProblem, type SignInBanner } from './usePhoneSignIn'

const HOME = '/buyer/orders'

/** Where to go once signed in: the page the buyer came from, never the seller or admin areas. */
export function buyerReturnTo(raw: string | null): string {
  const back = safeReturnTo(raw, HOME)
  return back.startsWith('/seller') || back.startsWith('/admin') || back.startsWith('/buyer/sign-in')
    ? HOME
    : back
}

/** B8 Buyer sign-in (design/B8-buyer-sign-in). Route /buyer/sign-in. SMS code, no password. */
export function useBuyerSignIn() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const session = useSession()
  const returnTo = buyerReturnTo(params.get('returnTo'))
  const flow = usePhoneSignIn(() => navigate(returnTo, { replace: true }))
  return {
    ...flow,
    /** Already signed in as a buyer: go straight on. */
    redirect: session.status === 'authenticated' && session.role === 'buyer' ? returnTo : null,
  }
}
