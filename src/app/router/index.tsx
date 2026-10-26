import { createBrowserRouter, type RouteObject } from 'react-router'
import { LoadingPage, NotFoundPage } from '@/views/pages/shared/system'
import { RequireRole } from './guards'
import { RouteError } from './RouteError'
import { BuyerShell } from './shells'

// Lazy page modules: one chunk per buyer page (a buyer from an SMS link loads only that page), one per
// seller, admin and shared area.
const seller = () => import('./screens/seller')
const admin = () => import('./screens/admin')
const shared = () => import('./screens/shared')
const dev = () => import('@/views/pages/dev/UiGallery')
// S12 has its own chunk so the charts library loads only on the analytics page.
const analytics = () => import('./screens/analytics')

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
    // Shown while the first lazy route loads.
    HydrateFallback: LoadingPage,
    children: [
      { path: '/', lazy: page(shared, 'X1') },
      { path: '/help', lazy: page(shared, 'X3') },

      // Buyer
      {
        element: <BuyerShell />,
        children: [
          {
            path: '/pay/return',
            lazy: page(() => import('@/views/pages/buyer/PayReturnPage'), 'PayReturnPage'),
          },
          { path: '/pay/:listingId', lazy: page(() => import('@/views/pages/buyer/PayPage'), 'PayPage') },
          {
            path: '/order/:orderId',
            lazy: page(() => import('@/views/pages/buyer/OrderTrackerPage'), 'OrderTrackerPage'),
          },
          {
            path: '/order/:orderId/payment',
            lazy: page(() => import('@/views/pages/buyer/PaymentPage'), 'PaymentPage'),
          },
          {
            path: '/order/:orderId/inspect',
            lazy: page(() => import('@/views/pages/buyer/InspectionPage'), 'InspectionPage'),
          },
          {
            path: '/order/:orderId/report',
            lazy: page(() => import('@/views/pages/buyer/ReportIssuePage'), 'ReportIssuePage'),
          },
          {
            path: '/order/:orderId/return',
            lazy: page(() => import('@/views/pages/buyer/ReturnFlowPage'), 'ReturnFlowPage'),
          },
          {
            path: '/order/:orderId/timeline',
            lazy: page(() => import('@/views/pages/buyer/TimelinePage'), 'TimelinePage'),
          },
          {
            path: '/buyer/sign-in',
            lazy: page(() => import('@/views/pages/buyer/BuyerSignInPage'), 'BuyerSignInPage'),
          },
          {
            path: '/buyer/orders',
            lazy: page(() => import('@/views/pages/buyer/MyOrdersPage'), 'MyOrdersPage'),
          },
        ],
      },

      // Seller (public)
      { path: '/register', lazy: page(seller, 'S1') },
      { path: '/login', lazy: page(seller, 'S2') },
      { path: '/forgot-password', lazy: page(seller, 'ForgotPassword') },

      // Seller (signed in)
      {
        element: <RequireRole allow="seller" />,
        children: [
          { path: '/onboarding', lazy: page(seller, 'S3') },
          {
            lazy: page(() => import('./accountShells'), 'SellerShell'),
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
              { path: '/seller/analytics', lazy: page(analytics, 'S12') },
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
            lazy: page(() => import('./accountShells'), 'AdminShell'),
            children: [
              { path: '/admin', lazy: page(admin, 'A2') },
              { path: '/admin/cases/:id', lazy: page(admin, 'A3') },
              { path: '/admin/transactions', lazy: page(admin, 'A4') },
            ],
          },
        ],
      },

      // Component gallery, dev builds only (the branch is dropped from production bundles).
      ...(import.meta.env.DEV ? [{ path: '/dev/ui', lazy: page(dev, 'UiGallery') }] : []),

      { path: '*', element: <NotFoundPage /> },
    ],
  },
]

export const createAppRouter = () => createBrowserRouter(routes)
