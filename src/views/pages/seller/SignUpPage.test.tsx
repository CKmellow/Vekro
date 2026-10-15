import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { SignUpPage } from './SignUpPage'

const seller = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Amina Wanjiru',
  phone: '+254722118904',
  role: 'seller',
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
}

function renderPage() {
  const router = createMemoryRouter(
    [
      { path: '/register', element: <SignUpPage /> },
      { path: '/onboarding', element: <h1>Payout setup</h1> },
      { path: '/login', element: <h1>Log in</h1> },
    ],
    { initialEntries: ['/register'] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

async function fill(user: ReturnType<typeof renderPage>['user']) {
  await user.type(screen.getByLabelText('Full name'), 'Amina Wanjiru')
  await user.type(screen.getByLabelText('Phone number'), '0722118904')
  await user.type(screen.getByLabelText('Password'), 'sokoni2026')
  await user.type(screen.getByLabelText('Confirm password'), 'sokoni2026')
  await user.click(screen.getByRole('checkbox', { name: /terms/i }))
}

describe('S1 sign up', () => {
  it('validates before calling the API', async () => {
    const { user } = renderPage()
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('Enter your full name')).toBeInTheDocument()
    expect(screen.getByText('Agree to the terms to continue')).toBeInTheDocument()
  })

  it('registers as a seller, signs in and goes to payout setup', async () => {
    const calls: unknown[] = []
    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        calls.push(await request.json())
        return HttpResponse.json(seller, { status: 201 })
      }),
      http.post('/api/auth/login', () => HttpResponse.json(seller)),
    )
    const { user, router } = renderPage()
    await fill(user)
    expect(screen.getByText('Passwords match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByRole('heading', { name: 'Payout setup' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/onboarding')
    expect(calls[0]).toEqual({
      name: 'Amina Wanjiru',
      phone: '+254722118904',
      password: 'sokoni2026',
      role: 'seller',
      mpesa_phone: null,
    })
  })

  it('offers log in when the phone is already registered', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ detail: 'Phone number is already registered.' }, { status: 409 }),
      ),
    )
    const { user } = renderPage()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText('This number already has a Vekro account.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log in instead' })).toHaveAttribute('href', '/login')
  })

  it('keeps the details and shows a banner on a server error', async () => {
    server.use(http.post('/api/auth/register', () => HttpResponse.json({ detail: 'boom' }, { status: 500 })))
    const { user } = renderPage()
    await fill(user)
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText("We couldn't create your account")).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveValue('Amina Wanjiru')
  })
})
