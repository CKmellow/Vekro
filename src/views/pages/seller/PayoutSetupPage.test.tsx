import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { gapHandlers } from '@/mocks/registry'
import '@/mocks/gaps'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { PayoutSetupPage } from './PayoutSetupPage'

const mocked = new Set<string>()
vi.mock('@/models/api/adapters/gaps', async (original) => ({
  ...(await original<object>()),
  isMocked: (gap: string) => mocked.has(gap),
}))

beforeEach(() => {
  mocked.clear()
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

  it('saves through the gap mock and celebrates', async () => {
    mocked.add('SELLER_PROFILE')
    server.use(...(gapHandlers.SELLER_PROFILE ?? []))
    const { user } = renderPage()
    await toPayoutStep(user)
    await user.type(screen.getByLabelText('Confirm M-Pesa number'), '722118904')
    expect(screen.getByText('Numbers match')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Save and finish' }))
    expect(await screen.findByRole('heading', { name: "You're ready to sell" })).toBeInTheDocument()
    expect(screen.getByText('+254 722 *** 904')).toBeInTheDocument()
    expect(screen.queryByText("Your payout number isn't stored yet")).not.toBeInTheDocument()
  })

  it('says so when the payout number could not be stored', async () => {
    const { user } = renderPage()
    await toPayoutStep(user)
    await user.type(screen.getByLabelText('Confirm M-Pesa number'), '722118904')
    await user.click(screen.getByRole('button', { name: 'Save and finish' }))
    expect(await screen.findByText("Your payout number isn't stored yet")).toBeInTheDocument()
  })
})
