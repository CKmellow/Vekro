import { Navigate } from 'react-router'
import { useSession } from '@/controllers/useSession'
import { LoadingPage } from '@/views/pages/shared/system'

/**
 * `/` until the landing page (X1, #68) is built: signed-in sellers go to their listings, admins to
 * the console, everyone else to log in (which links to sign up).
 */
export function HomeRedirect() {
  const session = useSession()
  if (session.status === 'loading') return <LoadingPage />
  if (session.status === 'authenticated' && session.role === 'seller')
    return <Navigate to="/seller/listings" replace />
  if (session.status === 'authenticated' && session.role === 'admin') return <Navigate to="/admin" replace />
  return <Navigate to="/login" replace />
}
