import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { LogInPage } from './LogInPage'

const user = (role: string) => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Amina Wanjiru',
  phone: '+254722118904',
  role,
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
})

function renderAt(url: string) {
  server.use(
    http.get('/api/auth/me', () =>
      HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
    ),
  )
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LogInPage /> },
      { path: '/seller/*', element: <h1>Seller area</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

async function logIn(u: ReturnType<typeof renderAt>['user'], password = 'sokoni2026') {
  await u.type(screen.getByLabelText('Phone number'), '722118904')
  await u.type(screen.getByLabelText('Password'), password)
  await u.click(screen.getByRole('button', { name: 'Log in' }))
}

describe('S2 log in', () => {
  it('says the session expired and returns to the original page', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(user('seller'))))
    const { user: u, router } = renderAt('/login?returnTo=%2Fseller%2Forders%3Fsegment%3Dheld&reason=expired')
    expect(screen.getByText('Your session expired. Log in again.')).toBeInTheDocument()
    await logIn(u)
    await screen.findByRole('heading', { name: 'Seller area' })
    expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(
      '/seller/orders?segment=held',
    )
  })

  it('never follows an off-site return URL', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(user('seller'))))
    const { user: u, router } = renderAt('/login?returnTo=https%3A%2F%2Fevil.example')
    await logIn(u)
    await screen.findByRole('heading', { name: 'Seller area' })
    expect(router.state.location.pathname).toBe('/seller')
  })

  it('shows one generic message for wrong details and clears the password', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid phone or password.' }, { status: 401 }),
      ),
    )
    const { user: u } = renderAt('/login')
    await logIn(u, 'wrong-pass')
    expect(
      await screen.findByText("Phone or password doesn't match. Check them and try again."),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('locks the form for the Retry-After time', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json(
          { detail: 'Too many login attempts.' },
          { status: 429, headers: { 'Retry-After': '120' } },
        ),
      ),
    )
    const { user: u } = renderAt('/login')
    await logIn(u)
    expect(await screen.findByText('Too many attempts.')).toBeInTheDocument()
    expect(screen.getByRole('timer')).toHaveAccessibleName(
      /^Log in again in: (1 minute 59|2 minutes 0) seconds? left$/,
    )
    expect(screen.getByRole('button', { name: 'Log in' })).toBeDisabled()
    await act(async () => {})
  })

  it('tells a non-seller account this area is for sellers', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(user('buyer'))))
    const { user: u } = renderAt('/login')
    await logIn(u)
    expect(
      await screen.findByText('This area is for sellers. Log in with a seller account.'),
    ).toBeInTheDocument()
  })
})
