import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { PayoutSetupPage } from './PayoutSetupPage'

const profile = (over: Record<string, unknown> = {}) => ({
  name: 'Amina Wanjiru',
  phone: '+254722118904',
  shop_name: 'Amina Gadgets',
  shop_area: 'Westlands, Nairobi',
  shop_about: null,
  logo_url: null,
  mpesa_phone: '+254722118904',
  mpesa_account_name: 'AMINA WANJIRU',
  has_orders: false,
  updated_at: '2026-10-25T09:00:00Z',
  ...over,
})

beforeEach(() => {
  server.use(
    http.get('/api/auth/me', () =>
      HttpResponse.json({
        id: '1',
        name: 'Amina Wanjiru',
        phone: '+254722118904',
        role: 'seller',
        mpesa_phone: null,
        mpesa_account_name: null,
        is_active: true,
        created_at: '2026-10-15T09:00:00Z',
        session_expires_at: '2026-10-22T09:00:00Z',
      }),
    ),
  )
})

async function toPayoutStep(user: ReturnType<typeof renderWithProviders>['user']) {
  await screen.findByText('Signed in as Amina Wanjiru')
  await user.type(screen.getByLabelText('Shop display name'), 'Amina Gadgets')
  await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
  await screen.findByRole('heading', { name: 'Where should we send your money?' })
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <PayoutSetupPage />
    </MemoryRouter>,
  )

describe('S3 payout setup', () => {
  it('needs a shop name before step 2', async () => {
    const { user } = renderPage()
    await screen.findByText('Signed in as Amina Wanjiru')
    await user.click(screen.getAllByRole('button', { name: 'Next' })[0] as HTMLElement)
    expect(await screen.findByText('Enter the name buyers will see')).toBeInTheDocument()
  })

  it('shows the live fee example and blocks mismatched numbers', async () => {
    const { user } = renderPage()
    await toPayoutStep(user)
    expect(screen.getAllByText('KES 51,870').length).toBeGreaterThan(0)
    expect(screen.getByLabelText('M-Pesa payout number')).toHaveValue('722 118 904')
    await user.type(screen.getByLabelText('Confirm M-Pesa number'), '722118940')
    await user.click(screen.getByRole('button', { name: 'Save and finish' }))
    expect(await screen.findByText("The numbers don't match. Check the last digits.")).toBeInTheDocument()
  })

  it('saves the shop and payout details and celebrates', async () => {
    const sent: unknown[] = []
    server.use(
      http.patch('/api/me/profile', async ({ request }) => {
        sent.push(await request.json())
        return HttpResponse.json(profile())
      }),
      http.put('/api/me/mpesa-number', async ({ request }) => {
        sent.push(await request.json())
        return HttpResponse.json(profile())
      }),
    )
    const { user } = renderPage()
    await toPayoutStep(user)
    await user.type(screen.getByLabelText('Confirm M-Pesa number'), '722118904')
    expect(screen.getByText('Numbers match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save and finish' }))
    expect(await screen.findByRole('heading', { name: "You're ready to sell" })).toBeInTheDocument()
    expect(screen.getByText('+254 722 *** 904')).toBeInTheDocument()
    expect(sent[0]).toMatchObject({ shop_name: 'Amina Gadgets' })
    expect(sent[1]).toEqual({ mpesa_phone: '+254722118904', mpesa_account_name: 'AMINA WANJIRU', code: null })
  })

  it('sends sellers who already have orders to Settings for a new number', async () => {
    server.use(
      http.patch('/api/me/profile', () => HttpResponse.json(profile({ has_orders: true }))),
      http.put('/api/me/mpesa-number', () => HttpResponse.json({ detail: 'Confirm' }, { status: 428 })),
    )
    const { user } = renderPage()
    await toPayoutStep(user)
    await user.type(screen.getByLabelText('Confirm M-Pesa number'), '722118904')
    await user.click(screen.getByRole('button', { name: 'Save and finish' }))
    expect(await screen.findByText(/Change it in Settings/)).toBeInTheDocument()
  })
})
