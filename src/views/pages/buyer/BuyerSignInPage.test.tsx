import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { BuyerSignInPage } from './BuyerSignInPage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const buyer = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Wanjiru',
  phone: '+254712345678',
  role: 'buyer',
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
}

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
      { path: '/buyer/sign-in', element: <BuyerSignInPage /> },
      { path: '/buyer/orders', element: <h1>My orders</h1> },
      { path: '/order/:id', element: <h1>Order page</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

async function toCodeStep(u: ReturnType<typeof renderAt>['user']) {
  await u.type(screen.getByLabelText('Phone number'), '712345678')
  await u.click(screen.getByRole('button', { name: 'Send code' }))
  await screen.findByText(/Enter the 6-digit code we sent to/)
}

describe('B8 buyer sign-in', () => {
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
        return HttpResponse.json(buyer)
      }),
    )
    const { user: u, router } = renderAt('/buyer/sign-in?returnTo=%2Forder%2Fabc')
    expect(screen.getByRole('heading', { name: 'See all your orders' })).toBeInTheDocument()
    await toCodeStep(u)
    expect(asked).toEqual({ phone: '+254712345678' })
    expect(screen.getByText('+254 712 *** 678')).toBeInTheDocument()
    expect(screen.getByText(/Resend in/)).toHaveTextContent(/0:(30|29)/)

    await u.type(screen.getByLabelText('Digit 1 of 6'), '482913')
    await screen.findByRole('heading', { name: 'Order page' })
    expect(verified).toEqual({ phone: '+254712345678', code: '482913' })
    expect(router.state.location.pathname).toBe('/order/abc')
  })

  it('checks the number before sending', async () => {
    const { user: u } = renderAt('/buyer/sign-in')
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
    const { user: u } = renderAt('/buyer/sign-in')
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
    const { user: u } = renderAt('/buyer/sign-in')
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
    const { user: u } = renderAt('/buyer/sign-in')
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
    const { user: u } = renderAt('/buyer/sign-in')
    await toCodeStep(u)
    expect(screen.getByText(/Resend in/)).toHaveTextContent(/0:1[12]/)
  })

  it('sends seller numbers to the seller log in', async () => {
    server.use(
      http.post('/api/auth/phone/request-code', sent),
      http.post('/api/auth/phone/verify', () =>
        HttpResponse.json({ detail: 'This number has a seller account.' }, { status: 409 }),
      ),
    )
    const { user: u } = renderAt('/buyer/sign-in')
    await toCodeStep(u)
    await u.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    expect(
      await screen.findByText('This number has a seller account. Log in with your password.'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Seller log in' })).toHaveAttribute('href', '/login')
  })

  it('says when the buyer is offline', async () => {
    server.use(http.post('/api/auth/phone/request-code', () => HttpResponse.error()))
    const { user: u } = renderAt('/buyer/sign-in')
    await u.type(screen.getByLabelText('Phone number'), '712345678')
    await u.click(screen.getByRole('button', { name: 'Send code' }))
    expect(await screen.findByText("You're offline. Connect and try again.")).toBeInTheDocument()
  })

  it('lets the buyer change the number', async () => {
    server.use(http.post('/api/auth/phone/request-code', sent))
    const { user: u } = renderAt('/buyer/sign-in')
    await toCodeStep(u)
    await u.click(screen.getByRole('button', { name: 'Use a different number' }))
    expect(screen.getByLabelText('Phone number')).toHaveValue('712 345 678')
  })

  it('sends a signed-in buyer straight on', async () => {
    renderAt('/buyer/sign-in', buyer)
    expect(await screen.findByRole('heading', { name: 'My orders' })).toBeInTheDocument()
  })
})
