import { hasStore } from '@/models/domain/roleHome'
import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession, type Role } from '@/controllers/useSession'
import { ErrorPage, LoadingPage, NoPermissionPage, OfflinePage } from '@/views/pages/shared/system'

/** Gate a route subtree to one role. Anonymous users go to the one log in page with a return URL. */
export function RequireRole({ allow: role }: { allow: Role }) {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') return session.offline ? <OfflinePage /> : <LoadingPage />
  if (session.status === 'error')
    return session.offline ? <OfflinePage onRetry={session.retry} /> : <ErrorPage onRetry={session.retry} />
  if (session.status === 'anonymous') {
    const params = new URLSearchParams({ returnTo: `${location.pathname}${location.search}` })
    if (session.expired) params.set('reason', 'expired')
    // Most buyers sign in with an SMS code; start there in the buyer area.
    if (role === 'buyer') params.set('method', 'code')
    return <Navigate to={`/login?${params}`} replace />
  }
  // The seller area belongs to every account with a store, open or closed (a closed store still
  // reads its history); the console to admins.
  // The buyer area to every member (M21): one account buys and sells; admins have none.
  const allowed =
    role === 'seller'
      ? hasStore(session.account)
      : role === 'buyer'
        ? session.role !== 'admin'
        : session.role === role
  if (!allowed) return <NoPermissionPage area={role} />
  return <Outlet />
}

/**
 * The old log in addresses (/admin/login, /buyer/sign-in) live on in SMS links and bookmarks: send
 * them to the one log in page, keeping returnTo and reason; buyers start on the SMS code.
 */
export function ToLogIn({ method }: { method?: 'code' }) {
  const location = useLocation()
  const params = new URLSearchParams(location.search)
  if (method) params.set('method', method)
  return <Navigate to={`/login?${params}`} replace />
}
