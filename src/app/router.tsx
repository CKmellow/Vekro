import { createBrowserRouter, type RouteObject } from 'react-router'
import { NotFoundPage } from '@/views/pages/shared/system'
import { RequireRole } from './guards'
import { RouteError } from './RouteError'
import { AdminShell, BuyerShell, SellerShell } from './shells'

// Lazy page modules: one chunk per area keeps the buyer bundle small.
const buyer = () => import('@/views/pages/buyer/routes')
const seller = () => import('@/views/pages/seller/routes')
const admin = () => import('@/views/pages/admin/routes')
const shared = () => import('@/views/pages/shared/routes')

type Module = Record<string, React.ComponentType>
const page =
  <M extends Module>(load: () => Promise<M>, name: keyof M & string) =>
  async () => ({ Component: (await load())[name] })

/**
 * Route table (docs/PAGES.md with the FRONTEND_CONTRACT deviations).
 * Buyers have no account wall: buyer routes are public; the pages handle identity.
 */
export const routes: RouteObject[] = [
  {
    errorElement: <RouteError />,
    children: [
      { path: '/', lazy: page(shared, 'X1') },
      { path: '/help', lazy: page(shared, 'X3') },

      // Buyer
      {
        element: <BuyerShell />,
        children: [
          { path: '/pay/return', lazy: page(buyer, 'PayReturn') },
          { path: '/pay/:listingId', lazy: page(buyer, 'B1') },
          { path: '/order/:orderId', lazy: page(buyer, 'B3') },
          { path: '/order/:orderId/payment', lazy: page(buyer, 'B2') },
          { path: '/order/:orderId/inspect', lazy: page(buyer, 'B4') },
          { path: '/order/:orderId/report', lazy: page(buyer, 'B5') },
          { path: '/order/:orderId/return', lazy: page(buyer, 'B6') },
          { path: '/order/:orderId/timeline', lazy: page(buyer, 'B7') },
          { path: '/buyer/sign-in', lazy: page(buyer, 'B8') },
          { path: '/buyer/orders', lazy: page(buyer, 'B9') },
        ],
      },

      // Seller (public)
      { path: '/register', lazy: page(seller, 'S1') },
      { path: '/login', lazy: page(seller, 'S2') },

      // Seller (signed in)
      {
        element: <RequireRole allow="seller" />,
        children: [
          { path: '/onboarding', lazy: page(seller, 'S3') },
          {
            element: <SellerShell />,
            children: [
              { path: '/seller', lazy: page(seller, 'S4') },
              { path: '/seller/orders', lazy: page(seller, 'S5') },
              { path: '/seller/orders/:id', lazy: page(seller, 'S6') },
              { path: '/seller/listings', lazy: page(seller, 'S8') },
              { path: '/seller/listings/new', lazy: page(seller, 'S7') },
              { path: '/seller/listings/:id', lazy: page(seller, 'S9') },
              { path: '/seller/listings/:id/edit', lazy: page(seller, 'S7') },
              { path: '/seller/returns', lazy: page(seller, 'S10') },
              { path: '/seller/returns/:id', lazy: page(seller, 'S11') },
              { path: '/seller/analytics', lazy: page(seller, 'S12') },
              { path: '/seller/settings', lazy: page(seller, 'S13') },
              { path: '/seller/notifications', lazy: page(seller, 'S14') },
            ],
          },
        ],
      },

      // Admin
      { path: '/admin/login', lazy: page(admin, 'A1') },
      {
        element: <RequireRole allow="admin" />,
        children: [
          {
            element: <AdminShell />,
            children: [
              { path: '/admin', lazy: page(admin, 'A2') },
              { path: '/admin/cases/:id', lazy: page(admin, 'A3') },
              { path: '/admin/transactions', lazy: page(admin, 'A4') },
            ],
          },
        ],
      },

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
