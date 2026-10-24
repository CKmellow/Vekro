import { Outlet } from 'react-router'
import { useShell } from '@/controllers/useShell'
import { AdminLayout } from '@/views/layouts/AdminLayout'
import { BuyerLayout } from '@/views/layouts/BuyerLayout'
import { SellerLayout } from '@/views/layouts/SellerLayout'

export function BuyerShell() {
  return (
    <BuyerLayout>
      <Outlet />
    </BuyerLayout>
  )
}

export function SellerShell() {
  const shell = useShell()
  return (
    <SellerLayout
      name={shell.name}
      ordersNeedingAction={shell.ordersNeedingAction}
      openReturns={shell.openReturns}
      onSearch={shell.onSellerSearch}
    >
      <Outlet />
    </SellerLayout>
  )
}

export function AdminShell() {
  const shell = useShell()
  return (
    <AdminLayout name={shell.name} onSearch={shell.onAdminSearch}>
      <Outlet />
    </AdminLayout>
  )
}
