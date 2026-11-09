import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { LogInPage } from './LogInPage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

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

const sent = () =>
  HttpResponse.json(
    { resend_after_seconds: 30, expires_at: '2026-10-25T09:05:00Z', dev_code: null },
    { status: 202 },
  )

function renderAt(url: string, me: object | null = null) {
  server.use(
    http.get('/api/auth/me', () =>
      me ? HttpResponse.json(me) : HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
    ),
  )
  const router = createMemoryRouter(
    [
      { path: '/login', element: <LogInPage /> },
      { path: '/seller/*', element: <h1>Seller area</h1> },
      { path: '/admin/*', element: <h1>Console</h1> },
      { path: '/buyer/orders', element: <h1>My orders</h1> },
      { path: '/order/:id', element: <h1>Order page</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

async function logIn(u: ReturnType<typeof renderAt>['user'], password = 'sokoni2026') {
  // The password form is its own lazy chunk.
  await u.type(await screen.findByLabelText('Phone number'), '722118904')
  await u.type(screen.getByLabelText('Password'), password)
  await u.click(screen.getByRole('button', { name: 'Log in' }))
}

const where = (router: ReturnType<typeof renderAt>['router']) =>
  `${router.state.location.pathname}${router.state.location.search}`

describe('log in for every role', () => {
  it.each([
    ['seller', 'Seller area', '/seller'],
    ['admin', 'Console', '/admin'],
    ['buyer', 'My orders', '/buyer/orders'],
  ])('sends a %s to their own area', async (role, heading, path) => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(user(role))))
    const { user: u, router } = renderAt('/login')
    await logIn(u)
    await screen.findByRole('heading', { name: heading })
    expect(router.state.location.pathname).toBe(path)
  })

  it('says the session expired and returns to the page in their area', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(user('admin'))))
    const { user: u, router } = renderAt('/login?returnTo=%2Fadmin%2Ftransactions%3Fq%3DVK&reason=expired')
    expect(screen.getByText('Your session expired. Log in again.')).toBeInTheDocument()
    await logIn(u)
    await screen.findByRole('heading', { name: 'Console' })
    expect(where(router)).toBe('/admin/transactions?q=VK')
  })

  it("never returns someone into another role's area", async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(user('seller'))))
    const { user: u, router } = renderAt('/login?returnTo=%2Fadmin')
    await logIn(u)
    await screen.findByRole('heading', { name: 'Seller area' })
    expect(router.state.location.pathname).toBe('/seller')
  })

  it('never follows an off-site return URL', async () => {
    server.use(http.post('/api/auth/login', () => HttpResponse.json(user('buyer'))))
    const { user: u, router } = renderAt('/login?returnTo=https%3A%2F%2Fevil.example')
    await logIn(u)
    await screen.findByRole('heading', { name: 'My orders' })
    expect(router.state.location.pathname).toBe('/buyer/orders')
  })

  it('sends someone already signed in straight to their area', async () => {
    renderAt('/login', user('admin'))
    expect(await screen.findByRole('heading', { name: 'Console' })).toBeInTheDocument()
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
})

async function toCodeStep(u: ReturnType<typeof renderAt>['user']) {
  await u.type(screen.getByLabelText('Phone number'), '712345678')
  await u.click(screen.getByRole('button', { name: 'Send code' }))
  await screen.findByText(/Enter the 6-digit code we sent to/)
}

describe('log in with an SMS code (buyers)', () => {
  it('texts a code, shows the masked number and signs in on the sixth digit', async () => {
    let asked: unknown
    let verified: unknown
    server.use(
      http.post('/api/auth/phone/request-code', async ({ request }) => {
        asked = await request.json()
        return sent()
      }),
      http.post('/api/auth/phone/verify', async ({ request }) => {
        verified = await request.json()
        return HttpResponse.json(user('buyer'))
      }),
    )
    const { user: u, router } = renderAt('/login?method=code&returnTo=%2Forder%2Fabc')
    expect(screen.getByRole('radio', { name: 'Text me a code' })).toBeChecked()
    await toCodeStep(u)
    expect(asked).toEqual({ phone: '+254712345678' })
    expect(screen.getByText('+254 712 *** 678')).toBeInTheDocument()
    expect(screen.getByText(/Resend in/)).toHaveTextContent(/0:(30|29)/)

    await u.type(screen.getByLabelText('Digit 1 of 6'), '482913')
    await screen.findByRole('heading', { name: 'Order page' })
    expect(verified).toEqual({ phone: '+254712345678', code: '482913' })
    expect(router.state.location.pathname).toBe('/order/abc')
  })

  it('switches between the two ways to log in', async () => {
    const { user: u } = renderAt('/login')
    expect(await screen.findByLabelText('Password')).toBeInTheDocument()
    await u.click(screen.getByRole('radio', { name: 'Text me a code' }))
    expect(screen.getByRole('button', { name: 'Send code' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument()
    await u.click(screen.getByRole('radio', { name: 'Phone and password' }))
    expect(await screen.findByLabelText('Password')).toBeInTheDocument()
  })

  it('checks the number before sending', async () => {
    const { user: u } = renderAt('/login?method=code')
    await u.click(screen.getByRole('button', { name: 'Send code' }))
    expect(screen.getByText('Enter 9 digits starting with 7 or 1')).toBeInTheDocument()
  })

  it('clears a wrong code, says so and keeps the buyer on the code step', async () => {
    server.use(
      http.post('/api/auth/phone/request-code', sent),
      http.post('/api/auth/phone/verify', () =>
        HttpResponse.json({ detail: "That code doesn't match." }, { status: 422 }),
      ),
    )
    const { user: u } = renderAt('/login?method=code')
    await toCodeStep(u)
    await u.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    expect(await screen.findByRole('alert')).toHaveTextContent("That code doesn't match.")
    expect(screen.getByLabelText('Digit 1 of 6')).toHaveValue('')
    await waitFor(() => expect(screen.getByLabelText('Digit 1 of 6')).toHaveFocus())
  })

  it('offers a new code when the code has expired', async () => {
    server.use(
      http.post('/api/auth/phone/request-code', sent),
      http.post('/api/auth/phone/verify', () =>
        HttpResponse.json({ detail: 'That code has expired.' }, { status: 410 }),
      ),
    )
    const { user: u } = renderAt('/login?method=code')
    await toCodeStep(u)
    await u.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    expect(await screen.findByRole('alert')).toHaveTextContent('That code has expired.')
    expect(screen.getByRole('button', { name: 'Send a new code' })).toBeInTheDocument()
  })

  it('locks the form after too many tries, with the server countdown', async () => {
    server.use(
      http.post('/api/auth/phone/request-code', sent),
      http.post('/api/auth/phone/verify', () =>
        HttpResponse.json({ detail: 'Too many tries.' }, { status: 429, headers: { 'Retry-After': '300' } }),
      ),
    )
    const { user: u } = renderAt('/login?method=code')
    await toCodeStep(u)
    await u.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    expect(await screen.findByText(/Too many tries. Try again in (5:00|4:59)/)).toBeInTheDocument()
    expect(screen.getByLabelText('Digit 1 of 6')).toBeDisabled()
  })

  it('goes to the code step when a code was sent moments ago', async () => {
    server.use(
      http.post('/api/auth/phone/request-code', () =>
        HttpResponse.json({ detail: 'Too many codes.' }, { status: 429, headers: { 'Retry-After': '12' } }),
      ),
    )
    const { user: u } = renderAt('/login?method=code')
    await toCodeStep(u)
    expect(screen.getByText(/Resend in/)).toHaveTextContent(/0:1[12]/)
  })

  it('moves a seller number over to the password form', async () => {
    server.use(
      http.post('/api/auth/phone/request-code', sent),
      http.post('/api/auth/phone/verify', () =>
        HttpResponse.json({ detail: 'This number has a seller account.' }, { status: 409 }),
      ),
    )
    const { user: u } = renderAt('/login?method=code')
    await toCodeStep(u)
    await u.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    expect(
      await screen.findByText('This number has a seller account. Log in with your password.'),
    ).toBeInTheDocument()
    await u.click(screen.getByRole('button', { name: 'Use my password' }))
    expect(await screen.findByLabelText('Password')).toBeInTheDocument()
  })

  it('says when the buyer is offline', async () => {
    server.use(http.post('/api/auth/phone/request-code', () => HttpResponse.error()))
    const { user: u } = renderAt('/login?method=code')
    await u.type(screen.getByLabelText('Phone number'), '712345678')
    await u.click(screen.getByRole('button', { name: 'Send code' }))
    expect(await screen.findByText("You're offline. Connect and try again.")).toBeInTheDocument()
  })

  it('lets the buyer change the number', async () => {
    server.use(http.post('/api/auth/phone/request-code', sent))
    const { user: u } = renderAt('/login?method=code')
    await toCodeStep(u)
    await u.click(screen.getByRole('button', { name: 'Use a different number' }))
    expect(screen.getByLabelText('Phone number')).toHaveValue('712 345 678')
  })
})
