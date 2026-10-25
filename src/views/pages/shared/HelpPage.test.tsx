import { screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { HelpPage } from './HelpPage'

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <HelpPage />
    </MemoryRouter>,
  )

describe('HelpPage', () => {
  beforeEach(() => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
      ),
    )
  })

  it('groups the questions and opens one answer at a time per group', async () => {
    const { user } = renderPage()
    expect(screen.getByRole('heading', { name: 'How can we help?' })).toBeInTheDocument()
    for (const group of ['Paying', 'Delivery and inspection', 'Returns and refunds', 'Selling'])
      expect(screen.getByRole('heading', { name: group })).toBeInTheDocument()

    const safe = screen.getByRole('button', { name: 'How does Vekro keep my money safe?' })
    const failed = screen.getByRole('button', { name: 'Why did the M-Pesa prompt fail?' })
    expect(safe).toHaveAttribute('aria-expanded', 'false')
    await user.click(safe)
    expect(safe).toHaveAttribute('aria-expanded', 'true')
    await user.click(failed)
    expect(failed).toHaveAttribute('aria-expanded', 'true')
    expect(safe).toHaveAttribute('aria-expanded', 'false')
  })

  it('filters as you type, announces the count and offers to clear an empty search', async () => {
    const { user } = renderPage()
    const search = screen.getByRole('searchbox', { name: 'Search help' })
    await user.type(search, 'wrong PIN')
    expect(screen.getByRole('status')).toHaveTextContent(/answers? found/)
    expect(screen.getByText(/meet a wrong PIN/)).toBeVisible()
    expect(screen.queryByRole('heading', { name: 'Selling' })).not.toBeInTheDocument()

    await user.clear(search)
    await user.type(search, 'refund later zebra')
    expect(screen.getByText('No answers match "refund later zebra"')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search' }))
    expect(search).toHaveValue('')
    expect(screen.getByRole('heading', { name: 'Selling' })).toBeInTheDocument()
  })

  it('points signed-out visitors to buyer sign-in for their orders', () => {
    renderPage()
    expect(screen.getByRole('link', { name: 'See all your orders' })).toHaveAttribute(
      'href',
      '/buyer/sign-in',
    )
  })

  it('falls back to the SMS line when no support contact is configured', () => {
    renderPage()
    const card = screen.getByRole('region', { name: 'Talk to Vekro support' })
    expect(within(card).getByText('Reply to any Vekro SMS to reach support.')).toBeInTheDocument()
    expect(within(card).queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Report a problem with this page' })).not.toBeInTheDocument()
  })
})
