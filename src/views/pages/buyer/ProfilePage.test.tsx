import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ProfilePage } from './ProfilePage'

const me = (overrides: object = {}) => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Amina Otieno',
  phone: '+254712345678',
  role: 'buyer',
  account_type: 'member',
  store: { status: 'none', name: null, opened_at: null, closed_at: null, payout_ready: false },
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
  has_password: true,
  sms_login_enabled: true,
  ...overrides,
})

function renderProfile(user = me()) {
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json(user)),
    http.get('/api/auth/sessions', () => HttpResponse.json([])),
    http.get('/api/auth/google/status', () => HttpResponse.json({ enabled: false })),
  )
  const router = createMemoryRouter([{ path: '/buyer/profile', element: <ProfilePage /> }], {
    initialEntries: ['/buyer/profile'],
  })
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('B12 profile and security', () => {
  it('saves the name and turns SMS-code sign-in off, explaining a refusal', async () => {
    let enabled: boolean | undefined
    let saved: unknown
    server.use(
      http.patch('/api/account/profile', async ({ request }) => {
        saved = await request.json()
        return HttpResponse.json({ name: 'Amina O.', phone: '+254712345678', google_email: null })
      }),
      http.put('/api/account/sms-login', async ({ request }) => {
        enabled = ((await request.json()) as { enabled: boolean }).enabled
        return HttpResponse.json({ detail: 'x' }, { status: 409 })
      }),
    )
    const { user } = renderProfile()
    const name = await screen.findByLabelText('Your name')
    await user.clear(name)
    await user.type(name, 'Amina O.')
    await user.click(screen.getByRole('button', { name: 'Save name' }))
    await vi.waitFor(() => expect(saved).toEqual({ name: 'Amina O.' }))

    await user.click(screen.getByRole('switch', { name: 'Sign in with an SMS code' }))
    expect(
      await screen.findByText('Set a password or link Google first, so you can still sign in.'),
    ).toBeInTheDocument()
    expect(enabled).toBe(false)
  })

  it('changes the sign-in number with a code sent to it', async () => {
    let changed: unknown
    server.use(
      http.post('/api/account/phone/request-code', () =>
        HttpResponse.json({ resend_after_seconds: 30, dev_code: null }, { status: 202 }),
      ),
      http.put('/api/account/phone', async ({ request }) => {
        changed = await request.json()
        return HttpResponse.json({ name: 'Amina Otieno', phone: '+254712000999', google_email: null })
      }),
    )
    const { user } = renderProfile()
    await user.click(await screen.findByRole('button', { name: 'Change' }))
    const sheet = await screen.findByRole('dialog', { name: 'Change your sign-in number' })
    await user.type(within(sheet).getByLabelText('New phone number'), '712000999')
    await user.click(within(sheet).getByRole('button', { name: 'Send code' }))
    const cells = await within(sheet).findAllByRole('textbox')
    await user.click(cells[0] as HTMLElement)
    await user.keyboard('123456')
    await vi.waitFor(() => expect(changed).toEqual({ phone: '+254712000999', code: '123456' }))
    await vi.waitFor(() =>
      expect(screen.queryByRole('dialog', { name: 'Change your sign-in number' })).toBeNull(),
    )
  })

  it('offers to set a password and links to the store for an account with one', async () => {
    renderProfile(
      me({
        has_password: false,
        role: 'seller',
        store: { status: 'active', name: 'Amina', opened_at: null, closed_at: null, payout_ready: true },
      }),
    )
    expect(await screen.findByRole('link', { name: 'Set a password' })).toHaveAttribute(
      'href',
      '/forgot-password',
    )
    expect(screen.getByRole('link', { name: 'Go to your store' })).toHaveAttribute('href', '/seller')
  })

  it('saves a USSD PIN and says when the password is wrong', async () => {
    server.use(http.post('/api/account/ussd-pin', () => HttpResponse.json({ detail: 'x' }, { status: 403 })))
    const { user } = renderProfile()
    await user.type(await screen.findByLabelText('New USSD PIN'), '12a34')
    await user.type(screen.getByLabelText('Your password'), 'Mango2026')
    await user.click(screen.getByRole('button', { name: 'Save PIN' }))
    expect(await screen.findByText("That password doesn't match.")).toBeInTheDocument()
  })
})
