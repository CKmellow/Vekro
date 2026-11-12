// Seller and console shells, loaded with their areas so buyers never download them (M16 #128).
import { Outlet } from 'react-router'
import { useBuyerShell } from '@/controllers/useBuyerShell'
import { useShell } from '@/controllers/useShell'
import { AdminLayout } from '@/views/layouts/AdminLayout'
import { BuyerAppLayout } from '@/views/layouts/BuyerAppLayout'
import { SellerLayout } from '@/views/layouts/SellerLayout'

export function SellerShell() {
  const shell = useShell()
  return (
    <SellerLayout
      name={shell.name}
      ordersNeedingAction={shell.ordersNeedingAction}
      openReturns={shell.openReturns}
      hasUnreadNotifications={shell.hasUnreadNotifications}
      onSearch={shell.onSellerSearch}
      onSwitchToBuying={shell.onSwitchToBuying}
    >
      <Outlet />
    </SellerLayout>
  )
}

export function AdminShell() {
  const shell = useShell()
  return (
    <AdminLayout
      name={shell.name}
      queueCount={shell.queueCount}
      onSearch={shell.onAdminSearch}
      onSignOut={shell.onAdminSignOut}
    >
      <Outlet />
    </AdminLayout>
  )
}

/** The buyer area (X4): every member, a store's owner too. */
export function BuyerAppShell() {
  const shell = useBuyerShell()
  return (
    <BuyerAppLayout
      name={shell.name}
      needsYou={shell.needsYou}
      openCases={shell.openCases}
      hasUnreadNotifications={shell.hasUnreadNotifications}
      hasStore={shell.hasStore}
      onSwitchToSelling={shell.onSwitchToSelling}
      onSignOut={shell.onSignOut}
    >
      <Outlet />
    </BuyerAppLayout>
  )
}
