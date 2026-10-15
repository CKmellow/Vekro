import { Navigate, Outlet, useLocation } from 'react-router'
import { useSession, type Role } from '@/controllers/useSession'
import { ErrorPage, LoadingPage, NoPermissionPage } from '@/views/pages/shared/system'

const LOGIN: Record<'seller' | 'admin', string> = { seller: '/login', admin: '/admin/login' }

/** Gate a route subtree to one role. Anonymous users go to that area's login with a return URL. */
export function RequireRole({ allow: role }: { allow: Extract<Role, 'seller' | 'admin'> }) {
  const session = useSession()
  const location = useLocation()

  if (session.status === 'loading') return <LoadingPage />
  if (session.status === 'error') return <ErrorPage onRetry={session.retry} />
  if (session.status === 'anonymous') {
    const returnTo = encodeURIComponent(`${location.pathname}${location.search}`)
    return <Navigate to={`${LOGIN[role]}?returnTo=${returnTo}`} replace />
  }
  if (session.role !== role) return <NoPermissionPage area={role} />
  return <Outlet />
}
