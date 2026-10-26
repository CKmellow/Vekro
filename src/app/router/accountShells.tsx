// Seller and console shells, loaded with their areas so buyers never download them (M16 #128).
import { Outlet } from 'react-router'
import { useShell } from '@/controllers/useShell'
import { AdminLayout } from '@/views/layouts/AdminLayout'
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
