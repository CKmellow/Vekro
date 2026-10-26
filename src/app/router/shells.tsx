import { Outlet } from 'react-router'
import { BuyerLayout } from '@/views/layouts/BuyerLayout'

export function BuyerShell() {
  return (
    <BuyerLayout>
      <Outlet />
    </BuyerLayout>
  )
}
