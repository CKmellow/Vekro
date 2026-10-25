import { useNavigate } from 'react-router'
import { useCases } from '@/models/queries/admin'
import { useUnreadCount } from '@/models/queries/notifications'
import { useOrders } from '@/models/queries/orders'
import { useSignOut } from '@/models/queries/session'
import { useSession } from './useSession'

/** Props for the signed-in seller and admin shells, including the seller's badge counts. */
export function useShell() {
  const session = useSession()
  const navigate = useNavigate()
  const seller = session.status === 'authenticated' && session.role === 'seller'
  // One small request; it shares the orders cache, so badges update with every order change.
  const orders = useOrders({ pageSize: 1 }, { enabled: seller, refetchInterval: 60_000 })
  const unread = useUnreadCount({ enabled: seller })
  const admin = session.status === 'authenticated' && session.role === 'admin'
  const queue = useCases('open', 1, { enabled: admin })
  const status = orders.data?.statusCounts
  const name = session.status === 'authenticated' ? session.user.name : ''
  const signOut = useSignOut()
  return {
    name,
    queueCount: queue.data?.counters.open,
    hasUnreadNotifications: (unread.data ?? 0) > 0,
    ordersNeedingAction: orders.data?.segmentCounts.needs_action,
    openReturns: status ? (status.return_in_transit ?? 0) + (status.return_received ?? 0) : undefined,
    onSellerSearch: (q: string) => navigate(`/seller/orders?q=${encodeURIComponent(q.trim())}`),
    onAdminSignOut: () =>
      signOut.mutate(undefined, { onSettled: () => navigate('/admin/login', { replace: true }) }),
    onAdminSearch: (q: string) => navigate(`/admin/transactions?q=${encodeURIComponent(q.trim())}`),
  }
}
