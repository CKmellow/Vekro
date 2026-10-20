import { notReady } from '@/views/pages/shared/system'
export { PayPage as B1 } from '@/views/pages/buyer/PayPage'

// Buyer screens (PAGES.md B1 to B9), inside BuyerLayout. Each is replaced by its real page when built.
export const B2 = notReady('buyer', 'Payment')
export const PayReturn = notReady('buyer', 'Payment confirmation')
export const B3 = notReady('buyer', 'Order tracker')
export const B4 = notReady('buyer', 'Inspection')
export const B5 = notReady('buyer', 'Issue report')
export const B6 = notReady('buyer', 'Returns')
export const B7 = notReady('buyer', 'Order timeline')
export const B8 = notReady('buyer', 'Buyer sign-in')
export const B9 = notReady('buyer', 'My orders')
