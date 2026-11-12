import { useNavigate } from 'react-router'
import { writeMode } from '@/lib/mode'
import { hasStore, SELLER_HOME } from '@/models/domain/roleHome'
import { useBuyerHome } from '@/models/queries/buyer'
import { useUnreadCount } from '@/models/queries/notifications'
import { useSignOut } from '@/models/queries/session'
import { useSession } from './useSession'

/** The buyer shell (X4): badges from the Home summary, the buying bell, the mode switch. */
export function useBuyerShell() {
  const session = useSession()
  const navigate = useNavigate()
  const signOut = useSignOut()
  const member = session.status === 'authenticated' && session.role !== 'admin'
  const home = useBuyerHome({ enabled: member })
  const unread = useUnreadCount({ enabled: member, audience: 'buying' })
  return {
    name: session.status === 'authenticated' ? session.user.name : '',
    hasStore: session.status === 'authenticated' && hasStore(session.account),
    needsYou: home.data?.needsYou.length || undefined,
    openCases: home.data?.counts.disputed || undefined,
    hasUnreadNotifications: (unread.data ?? 0) > 0,
    onSwitchToSelling: () => {
      writeMode('selling')
      navigate(SELLER_HOME)
    },
    onSignOut: () => signOut.mutate(undefined, { onSettled: () => navigate('/', { replace: true }) }),
  }
}
