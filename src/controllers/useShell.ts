import { useNavigate } from 'react-router'
import { useOrders } from '@/models/queries/orders'
import { useSession } from './useSession'

/** Props for the signed-in seller and admin shells, including the seller's badge counts. */
export function useShell() {
  const session = useSession()
  const navigate = useNavigate()
  const seller = session.status === 'authenticated' && session.role === 'seller'
  // One small request; it shares the orders cache, so badges update with every order change.
  const orders = useOrders({ pageSize: 1 }, { enabled: seller, refetchInterval: 60_000 })
  const status = orders.data?.statusCounts
  const name = session.status === 'authenticated' ? session.user.name : ''
  return {
    name,
    ordersNeedingAction: orders.data?.segmentCounts.needs_action,
    openReturns: status ? (status.return_in_transit ?? 0) + (status.return_received ?? 0) : undefined,
    onSellerSearch: (q: string) => navigate(`/seller/orders?q=${encodeURIComponent(q.trim())}`),
    onAdminSearch: (q: string) => navigate(`/admin/transactions?q=${encodeURIComponent(q.trim())}`),
  }
}
