import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { listingListResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { RouteError } from './RouteError'
import { routes } from '.'

const user = (role: 'buyer' | 'seller' | 'admin') => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Amina Gadgets',
  phone: '+254722118904',
  role,
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
})

function signedInAs(role: 'buyer' | 'seller' | 'admin' | null) {
  server.use(
    http.get('/api/auth/me', () =>
      role
        ? HttpResponse.json(user(role))
        : HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
    ),
  )
}

function renderAt(path: string) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('router', () => {
  it('serves the component gallery in dev builds', async () => {
    renderAt('/dev/ui')
    expect(
      await screen.findByRole('heading', { name: 'Vekro components', level: 1 }, { timeout: 3000 }),
    ).toBeInTheDocument()
  })

  it('lazy-loads public buyer routes without a session', async () => {
    renderAt('/buyer/orders')
    expect(await screen.findByRole('heading', { name: 'Still under construction' })).toBeInTheDocument()
    expect(screen.getByText(/building the My orders page/)).toBeInTheDocument()
  })

  it('sends visitors from / to log in until the landing page ships', async () => {
    signedInAs(null)
    const { router } = renderAt('/')
    await screen.findByRole('heading', { name: 'Log in to Vekro' })
    expect(router.state.location.pathname).toBe('/login')
  })

  it('sends a signed-in seller from / to their listings', async () => {
    signedInAs('seller')
    server.use(http.get('/api/listings', () => HttpResponse.json(listingListResponse([]))))
    const { router } = renderAt('/')
    await waitFor(() => expect(router.state.location.pathname).toBe('/seller/listings'))
  })

  it('sends unbuilt public pages to built pages only', async () => {
    renderAt('/help')
    await screen.findByRole('heading', { name: 'Still under construction' })
    expect(screen.getByRole('link', { name: 'Seller log in' })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: 'Start selling' })).toHaveAttribute('href', '/register')
  })

  it('shows the not-found page for unknown routes', async () => {
    renderAt('/nope')
    expect(await screen.findByRole('heading', { name: "We can't find that page" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Seller log in' })).toHaveAttribute('href', '/login')
    expect(document.title).toBe('Page not found · Vekro')
  })

  it('sends anonymous users to the seller login with a return URL', async () => {
    signedInAs(null)
    const { router } = renderAt('/seller/orders?segment=held')
    await screen.findByRole('heading', { name: 'Log in to Vekro' })
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe(
      `?returnTo=${encodeURIComponent('/seller/orders?segment=held')}`,
    )
  })

  it('says the session expired when it ends under a signed-in seller', async () => {
    signedInAs('seller')
    const { router, client } = renderAt('/seller/analytics')
    await screen.findByText(/building the Analytics page/)
    signedInAs(null)
    await act(() => client.invalidateQueries({ queryKey: ['session', 'me'] }))
    await screen.findByRole('heading', { name: 'Log in to Vekro' })
    expect(new URLSearchParams(router.state.location.search).get('reason')).toBe('expired')
    expect(new URLSearchParams(router.state.location.search).get('returnTo')).toBe('/seller/analytics')
  })

  it('sends anonymous users to the admin login for console routes', async () => {
    signedInAs(null)
    const { router } = renderAt('/admin')
    await screen.findByText(/building the Support console page/)
    expect(router.state.location.pathname).toBe('/admin/login')
  })

  it('lets a seller into seller routes', async () => {
    signedInAs('seller')
    renderAt('/seller')
    expect(await screen.findByRole('heading', { name: 'Still under construction' })).toBeInTheDocument()
    expect(screen.getByText(/building the Dashboard page/)).toBeInTheDocument()
    expect(document.title).toBe('Dashboard · Vekro')
  })

  it('keeps the seller nav on unbuilt seller pages and points back to listings', async () => {
    signedInAs('seller')
    renderAt('/seller/analytics')
    await screen.findByRole('heading', { name: 'Still under construction' })
    expect(screen.getByRole('link', { name: 'Go to your listings' })).toHaveAttribute(
      'href',
      '/seller/listings',
    )
    expect(screen.getByRole('link', { name: 'Create a listing' })).toHaveAttribute(
      'href',
      '/seller/listings/new',
    )
    expect(screen.getAllByRole('main')).toHaveLength(1)
  })

  it('shows a friendly no-permission page for the wrong role', async () => {
    signedInAs('buyer')
    renderAt('/seller')
    expect(await screen.findByRole('heading', { name: 'This area is for sellers' })).toBeInTheDocument()
  })

  it('keeps sellers out of the admin console', async () => {
    signedInAs('seller')
    renderAt('/admin/cases/1')
    expect(
      await screen.findByRole('heading', { name: "This account doesn't have console access" }),
    ).toBeInTheDocument()
  })

  it('shows the error page when the session check fails', async () => {
    server.use(http.get('/api/auth/me', () => HttpResponse.json({ detail: 'down' }, { status: 503 })))
    renderAt('/seller')
    expect(
      await screen.findByRole('heading', { name: 'Something went wrong' }, { timeout: 4000 }),
    ).toBeInTheDocument()
  })
})

describe('route error boundary', () => {
  it('catches render errors and shows the error page', async () => {
    // React and the router log the caught error; keep the expected noise out of the test output.
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    function Boom(): never {
      throw new Error('boom')
    }
    const router = createMemoryRouter(
      [{ errorElement: <RouteError />, children: [{ path: '/boom', element: <Boom /> }] }],
      {
        initialEntries: ['/boom'],
      },
    )
    renderWithProviders(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: 'Something went wrong' })).toBeInTheDocument()
    expect(logged).toHaveBeenCalled()
  })
})
