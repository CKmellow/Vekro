import { screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { signedInAs } from '@/test/session'
import { LandingPage } from './LandingPage'

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/seller" element={<h1>Seller dashboard</h1>} />
        <Route path="/admin" element={<h1>Console</h1>} />
      </Routes>
    </MemoryRouter>,
  )

describe('X1 landing', () => {
  it('explains Vekro and sends sellers to sign up', async () => {
    signedInAs(null)
    renderPage()
    expect(
      await screen.findByRole('heading', {
        level: 1,
        name: "Sell on social media. Get paid when they're happy.",
      }),
    ).toBeInTheDocument()
    for (const link of screen.getAllByRole('link', { name: 'Start selling' }))
      expect(link).toHaveAttribute('href', '/register')
    expect(screen.getByRole('heading', { name: 'How it works' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Pay into the vault' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'For sellers' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'An order in Vekro, from payment to payout' })).toBeInTheDocument()
    expect(screen.queryByText(/Track your order/)).not.toBeInTheDocument()
  })

  it('answers the first questions', async () => {
    signedInAs(null)
    const { user } = renderPage()
    const question = await screen.findByText('How does Vekro keep my money safe?')
    await user.click(question)
    expect(screen.getByText(/You pay by M-Pesa into a vault/)).toBeVisible()
    expect(screen.getByRole('link', { name: 'More answers in Help' })).toHaveAttribute('href', '/help')
  })

  it('sends signed-in sellers and admins to their apps', async () => {
    signedInAs('seller')
    const { unmount } = renderPage()
    expect(await screen.findByRole('heading', { name: 'Seller dashboard' })).toBeInTheDocument()
    unmount()
    signedInAs('admin')
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Console' })).toBeInTheDocument()
  })

  it('plays the order story on the hero phone', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    try {
      signedInAs(null)
      renderPage()
      expect(await screen.findByText('The buyer paid. The money is in the vault.')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(2600))
      expect(screen.getByText('Your item is on its way.')).toBeInTheDocument()
      await act(() => vi.advanceTimersByTimeAsync(2600))
      expect(screen.getByText('The buyer accepted. You got paid.')).toBeInTheDocument()
    } finally {
      vi.useRealTimers()
    }
  })
})
