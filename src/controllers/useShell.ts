import { useNavigate } from 'react-router'
import { useSession } from './useSession'

/** Props for the signed-in seller and admin shells. Badge counts arrive with the order lists (backend-gap #7). */
export function useShell() {
  const session = useSession()
  const navigate = useNavigate()
  const name = session.status === 'authenticated' ? session.user.name : ''
  return {
    name,
    onSellerSearch: (q: string) => navigate(`/seller/orders?q=${encodeURIComponent(q.trim())}`),
    onAdminSearch: (q: string) => navigate(`/admin/transactions?q=${encodeURIComponent(q.trim())}`),
  }
}
