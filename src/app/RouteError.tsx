import { isRouteErrorResponse, useRouteError } from 'react-router'
import { ErrorPage, NotFoundPage } from '@/views/pages/shared/system'

/** Error boundary for every route: 404s get the not-found page, anything else the error page. */
export function RouteError() {
  const error = useRouteError()
  if (isRouteErrorResponse(error) && error.status === 404) return <NotFoundPage />
  if (import.meta.env.DEV) console.error(error)
  return <ErrorPage />
}
