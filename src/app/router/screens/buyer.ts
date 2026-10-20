import { notReady } from '@/views/pages/shared/system'
export { PayPage as B1 } from '@/views/pages/buyer/PayPage'
export { PaymentPage as B2 } from '@/views/pages/buyer/PaymentPage'
export { PayReturnPage as PayReturn } from '@/views/pages/buyer/PayReturnPage'
export { OrderTrackerPage as B3 } from '@/views/pages/buyer/OrderTrackerPage'
export { InspectionPage as B4 } from '@/views/pages/buyer/InspectionPage'

// Buyer screens (PAGES.md B1 to B9), inside BuyerLayout. Each is replaced by its real page when built.
export const B5 = notReady('buyer', 'Issue report')
export const B6 = notReady('buyer', 'Returns')
export const B7 = notReady('buyer', 'Order timeline')
export const B8 = notReady('buyer', 'Buyer sign-in')
export const B9 = notReady('buyer', 'My orders')
