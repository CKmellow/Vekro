import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { GoogleSignUpPage } from './GoogleSignUpPage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const member = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Wanjiru Kamau',
  phone: '+254711000012',
  role: 'buyer',
  account_type: 'member',
  store: { status: 'none', name: null, opened_at: null, closed_at: null, payout_ready: false },
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-11-11T09:00:00Z',
  session_expires_at: '2026-11-18T09:00:00Z',
  google_email: 'wanjiru@example.com',
  has_password: false,
}

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/register/google', element: <GoogleSignUpPage /> },
      { path: '/buyer', element: <h1>Buyer home</h1> },
      { path: '/login', element: <h1>Log in</h1> },
    ],
    { initialEntries: ['/register/google'] },
  )
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('/register/google (#312)', () => {
  it('says the sign-up expired when there is none', async () => {
    server.use(
      http.get('/api/auth/google/signup', () => HttpResponse.json({ detail: 'gone' }, { status: 410 })),
    )
    renderPage()
    expect(await screen.findByText('This sign-up has expired.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Start again with Continue with Google' })).toHaveAttribute(
      'href',
      '/login',
    )
  })

  it('creates a member only after the SMS code, with the name typed, then opens the buyer area', async () => {
    let completed: unknown = null
    server.use(
      http.get('/api/auth/google/signup', () =>
        HttpResponse.json({ email: 'wanjiru@example.com', name: 'Wanjiru Kamau' }),
      ),
      http.post('/api/auth/google/signup/request-code', () =>
        HttpResponse.json(
          { resend_after_seconds: 30, expires_at: '2026-11-11T09:05:00Z', dev_code: null },
          { status: 202 },
        ),
      ),
      http.post('/api/auth/google/signup/complete', async ({ request }) => {
        completed = await request.json()
        return HttpResponse.json(member)
      }),
    )
    const { user } = renderPage()
    expect(await screen.findByText('wanjiru@example.com')).toBeInTheDocument()
    const name = screen.getByLabelText('Your name')
    expect(name).toHaveValue('Wanjiru Kamau')
    await user.clear(name)
    await user.type(name, 'Wanjiru K.')
    await user.type(screen.getByLabelText('Phone number'), '711000012')
    await user.click(screen.getByRole('button', { name: 'Text me a code' }))
    await user.type(await screen.findByRole('textbox', { name: 'Digit 1 of 6' }), '123456')
    expect(await screen.findByRole('heading', { name: 'Buyer home' })).toBeInTheDocument()
    expect(completed).toEqual({ phone: '+254711000012', code: '123456', name: 'Wanjiru K.' })
  })

  it('sends someone whose number already has an account to log in and link', async () => {
    server.use(
      http.get('/api/auth/google/signup', () => HttpResponse.json({ email: 'a@example.com', name: null })),
      http.post('/api/auth/google/signup/request-code', () =>
        HttpResponse.json({ detail: 'taken' }, { status: 409 }),
      ),
    )
    const { user } = renderPage()
    await user.type(await screen.findByLabelText('Phone number'), '711000013')
    await user.click(screen.getByRole('button', { name: 'Text me a code' }))
    expect(
      await screen.findByText(
        /already has a Vekro account\. Sign in with password or SMS code, then link Google in Profile & security/,
      ),
    ).toBeInTheDocument()
  })
})
