import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { RouteError } from './RouteError'
import { routes } from './router'

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
  it('lazy-loads public buyer routes without a session', async () => {
    renderAt('/pay/3fa85f64')
    expect(await screen.findByRole('heading', { name: 'Order summary and pay' })).toBeInTheDocument()
  })

  it('shows the not-found page for unknown routes', async () => {
    renderAt('/nope')
    expect(await screen.findByRole('heading', { name: "We can't find that page" })).toBeInTheDocument()
  })

  it('sends anonymous users to the seller login with a return URL', async () => {
    signedInAs(null)
    const { router } = renderAt('/seller/orders?segment=held')
    await screen.findByRole('heading', { name: 'Log in' })
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toBe(
      `?returnTo=${encodeURIComponent('/seller/orders?segment=held')}`,
    )
  })

  it('sends anonymous users to the admin login for console routes', async () => {
    signedInAs(null)
    const { router } = renderAt('/admin')
    await screen.findByRole('heading', { name: 'Vekro Support Console' })
    expect(router.state.location.pathname).toBe('/admin/login')
  })

  it('lets a seller into seller routes', async () => {
    signedInAs('seller')
    renderAt('/seller')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
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
  })
})
