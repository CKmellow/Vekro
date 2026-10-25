import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { SettingsPage } from './SettingsPage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const profile = (over: Record<string, unknown> = {}) => ({
  name: 'Amina Wanjiru',
  phone: '+254722118904',
  shop_name: 'Amina Gadgets',
  shop_area: 'Kilimani, Nairobi',
  shop_about: null,
  logo_url: null,
  mpesa_phone: '+254722118904',
  mpesa_account_name: 'AMINA WANJIRU',
  has_orders: true,
  updated_at: '2026-10-25T09:00:00Z',
  ...over,
})

function renderAt(url = '/seller/settings', over: Record<string, unknown> = {}) {
  let current = profile(over)
  const calls: { method: string; path: string; body: unknown }[] = []
  const record =
    (method: string) =>
    async ({ request }: { request: Request }) => {
      const body = await request.json().catch(() => null)
      calls.push({ method, path: new URL(request.url).pathname, body })
    }
  server.use(
    http.get('/api/me/profile', () => HttpResponse.json(current)),
    http.patch('/api/me/profile', async (info) => {
      await record('PATCH')(info)
      current = { ...current, ...(calls.at(-1)?.body as object) }
      return HttpResponse.json(current)
    }),
    http.post('/api/me/mpesa-number/request-code', async (info) => {
      await record('POST')(info)
      return HttpResponse.json(
        { resend_after_seconds: 30, expires_at: '2026-10-26T09:05:00Z', dev_code: null },
        { status: 202 },
      )
    }),
    http.put('/api/me/mpesa-number', async (info) => {
      await record('PUT')(info)
      const body = calls.at(-1)?.body as { code: string | null; mpesa_phone: string }
      if (current.has_orders && body.code !== '482913')
        return HttpResponse.json({ detail: "That code doesn't match." }, { status: 422 })
      current = { ...current, mpesa_phone: body.mpesa_phone }
      return HttpResponse.json(current)
    }),
  )
  const router = createMemoryRouter(
    [
      { path: '/seller/settings', element: <SettingsPage /> },
      { path: '/seller', element: <h1>Dashboard</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, calls, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('S13 settings: profile', () => {
  it('shows the save bar only when edited, and saves', async () => {
    const { user, calls } = renderAt()
    const name = await screen.findByLabelText('Shop name')
    expect(name).toHaveValue('Amina Gadgets')
    expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument()
    await user.clear(name)
    await user.type(name, 'Amina Phones')
    expect(screen.getByText('You have unsaved changes')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    await vi.waitFor(() => expect(screen.queryByText('You have unsaved changes')).not.toBeInTheDocument())
    expect(calls[0]).toMatchObject({ method: 'PATCH', body: { shop_name: 'Amina Phones' } })
  })

  it('checks the shop name and discards edits', async () => {
    const { user } = renderAt()
    const name = await screen.findByLabelText('Shop name')
    await user.clear(name)
    await user.click(screen.getByRole('button', { name: 'Save changes' }))
    expect(screen.getByText('Enter the name buyers will see')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Discard' }))
    expect(name).toHaveValue('Amina Gadgets')
  })

  it('asks before switching tabs with unsaved edits', async () => {
    const { user, router } = renderAt()
    await user.type(await screen.findByLabelText('City or area'), ' West')
    await user.click(screen.getByRole('tab', { name: 'Payout' }))
    const dialog = await screen.findByRole('alertdialog')
    expect(within(dialog).getByText('Discard your changes?')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Keep editing' }))
    expect(router.state.location.search).toBe('')
    await user.click(screen.getByRole('tab', { name: 'Payout' }))
    await user.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: 'Discard' }))
    expect(router.state.location.search).toBe('?tab=payout')
  })
})

describe('S13 settings: payout', () => {
  it('shows the masked number and confirms a new one by SMS code', async () => {
    const { user, calls } = renderAt('/seller/settings?tab=payout')
    expect(await screen.findByText('+254 722 *** 904')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Change' }))
    await user.type(screen.getByLabelText('New M-Pesa number'), '733000210')
    await user.type(screen.getByLabelText('Type it again'), '733000210')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    expect(await screen.findByText(/Enter the code we sent to \+254 733 \*\*\* 210/)).toBeInTheDocument()
    expect(calls[0]).toMatchObject({ method: 'POST', body: { mpesa_phone: '+254733000210' } })

    await user.type(screen.getByLabelText('Digit 1 of 6'), '111111')
    expect(await screen.findByRole('alert')).toHaveTextContent("That code doesn't match.")
    await user.type(screen.getByLabelText('Digit 1 of 6'), '482913')
    expect(await screen.findByText('+254 733 *** 210')).toBeInTheDocument()
  })

  it('blocks mismatched numbers and the current number', async () => {
    const { user } = renderAt('/seller/settings?tab=payout')
    await user.click(await screen.findByRole('button', { name: 'Change' }))
    await user.type(screen.getByLabelText('New M-Pesa number'), '722118904')
    await user.type(screen.getByLabelText('Type it again'), '722118940')
    await user.click(screen.getByRole('button', { name: 'Send code' }))
    expect(screen.getByText('This is already your payout number')).toBeInTheDocument()
    expect(screen.getByText("The numbers don't match. Check the last digits.")).toBeInTheDocument()
  })

  it('saves directly before the first order', async () => {
    const { user, calls } = renderAt('/seller/settings?tab=payout', { has_orders: false })
    await user.click(await screen.findByRole('button', { name: 'Change' }))
    await user.type(screen.getByLabelText('New M-Pesa number'), '733000210')
    await user.type(screen.getByLabelText('Type it again'), '733000210')
    await user.click(screen.getByRole('button', { name: 'Save number' }))
    expect(await screen.findByText('+254 733 *** 210')).toBeInTheDocument()
    expect(calls.map((c) => c.method)).toEqual(['PUT'])
  })

  it('says when the profile fails to load', async () => {
    server.use(http.get('/api/me/profile', () => HttpResponse.json({ detail: 'x' }, { status: 400 })))
    const router = createMemoryRouter([{ path: '/s', element: <SettingsPage /> }], { initialEntries: ['/s'] })
    renderWithProviders(<RouterProvider router={router} />)
    expect(await screen.findByText("We couldn't load your profile.")).toBeInTheDocument()
  })
})
