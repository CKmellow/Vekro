import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { adminTransactionRowResponse, orderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { TransactionsPage } from './TransactionsPage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const requests: URL[] = []
function serve(items = [adminTransactionRowResponse({ dispute_id: 'd-1' })]) {
  server.use(
    http.get('/api/admin/transactions', ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json({ items, total: items.length, page: 1, page_size: 25 })
    }),
    http.get(`/api/transactions/${orderResponse().id}`, () =>
      HttpResponse.json(orderResponse({ status: 'locked', viewer_role: 'admin', payment: null })),
    ),
    http.get(`/api/transactions/${orderResponse().id}/timeline`, () => HttpResponse.json([])),
  )
}

const renderPage = (entry = '/admin/transactions') =>
  renderWithProviders(
    <MemoryRouter initialEntries={[entry]}>
      <TransactionsPage />
    </MemoryRouter>,
  )

describe('A4 transactions explorer', () => {
  it('shows recent activity, then searches and filters through the URL', async () => {
    requests.length = 0
    serve()
    const { user } = renderPage()
    expect(await screen.findByRole('heading', { name: 'Recent activity' })).toBeInTheDocument()
    expect(await screen.findByText('+254712345678')).toBeInTheDocument()
    await user.type(screen.getByRole('searchbox', { name: 'Search orders' }), '0712 345 678')
    await user.click(screen.getByRole('button', { name: 'Search' }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('q')).toBe('0712 345 678'))
    await user.click(screen.getByRole('button', { name: 'Disputes' }))
    await waitFor(() =>
      expect(requests.at(-1)?.searchParams.getAll('status')).toContain('escalated_admin_review'),
    )
    await user.selectOptions(screen.getByLabelText('Item type'), 'serialized')
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('serialized')).toBe('true'))
    expect(screen.getByRole('heading', { name: 'Results' })).toBeInTheDocument()
  })

  it('opens a read-only slide-over with full phones and the case link', async () => {
    serve()
    const { user } = renderPage()
    await user.click(await screen.findByRole('button', { name: 'VK-7K3P9Q' }))
    const panel = await screen.findByRole('dialog', { name: 'VK-7K3P9Q' })
    expect(within(panel).getByText('+254722118904')).toBeInTheDocument()
    expect(within(panel).getByRole('link', { name: 'Open case' })).toHaveAttribute('href', '/admin/cases/d-1')
    await user.click(within(panel).getByRole('button', { name: 'Close' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('says when nothing matches and clears', async () => {
    serve([])
    const { user } = renderPage('/admin/transactions?q=nothing')
    expect(await screen.findByText('No orders match "nothing"')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear search and filters' }))
    expect(await screen.findByRole('heading', { name: 'Recent activity' })).toBeInTheDocument()
  })

  it('offers a retry when the search fails', async () => {
    server.use(http.get('/api/admin/transactions', () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("We couldn't search orders.")).toBeInTheDocument()
  })
})
