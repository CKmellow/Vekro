import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { StartSellingPage } from './StartSellingPage'

const member = (status: 'none' | 'active' = 'none') => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Amina Otieno',
  phone: '+254712345678',
  role: status === 'active' ? 'seller' : 'buyer',
  account_type: 'member',
  store: { status, name: null, opened_at: null, closed_at: null, payout_ready: false },
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
})

function renderWizard(url = '/buyer/start-selling', status: 'none' | 'active' = 'none') {
  server.use(http.get('/api/auth/me', () => HttpResponse.json(member(status))))
  const router = createMemoryRouter(
    [
      { path: '/buyer/start-selling', element: <StartSellingPage /> },
      { path: '/seller/listings/new', element: <h1>Create listing</h1> },
      { path: '/seller', element: <h1>Dashboard</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('S15 start selling', () => {
  it('opens a store, verifies the payout number with a code, then creates the first listing', async () => {
    const calls: { path: string; body: unknown }[] = []
    server.use(
      http.post('/api/account/store', async ({ request }) => {
        calls.push({ path: 'store', body: await request.json() })
        return HttpResponse.json({ status: 'active' }, { status: 201 })
      }),
      http.post('/api/me/mpesa-number/request-code', () =>
        HttpResponse.json(
          { resend_after_seconds: 30, expires_at: '2026-11-11T09:05:00Z', dev_code: null },
          { status: 202 },
        ),
      ),
      http.put('/api/me/mpesa-number', async ({ request }) => {
        calls.push({ path: 'payout', body: await request.json() })
        return HttpResponse.json({})
      }),
    )
    const { user, router } = renderWizard()
    await user.click(await screen.findByRole('button', { name: 'Open my store' }))
    expect(await screen.findByText('Give your store a name')).toBeInTheDocument()
    expect(screen.getByText('Accept the seller terms to open a store')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Store name'), 'Amina Baskets')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: 'Open my store' }))
    expect(await screen.findByLabelText('M-Pesa payout number')).toHaveValue('712 345 678')
    expect(calls[0]).toEqual({
      path: 'store',
      body: { shop_name: 'Amina Baskets', shop_area: null, terms_version: '2026-11' },
    })

    await user.click(screen.getByRole('button', { name: 'Text me a code' }))
    await user.type(await screen.findByRole('textbox', { name: 'Digit 1 of 6' }), '123456')
    await vi.waitFor(() => expect(router.state.location.pathname).toBe('/seller/listings/new'))
    expect(calls[1]).toEqual({
      path: 'payout',
      body: { mpesa_phone: '+254712345678', mpesa_account_name: 'Amina Otieno', code: '123456' },
    })
  })

  it('resumes at the payout number for a store that is open but not ready', async () => {
    renderWizard('/buyer/start-selling?step=payout', 'active')
    expect(await screen.findByLabelText('M-Pesa payout number')).toBeInTheDocument()
    expect(screen.queryByLabelText('Store name')).toBeNull()
  })
})
