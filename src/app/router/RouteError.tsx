import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ErrorPage, NotFoundPage, OfflinePage } from '@/views/pages/shared/system'

/**
 * Error boundary for every route: 404s get the not-found page, failures while offline the offline
 * page, anything else the error page.
 */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  // A page's code or data that can't load with no connection (no cached copy) gets the offline page.
  if (!navigator.onLine) return <OfflinePage />
  if (import.meta.env.DEV) console.error(error)
  return <ErrorPage />
}
