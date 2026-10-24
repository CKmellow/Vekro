import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { toast } from '@/lib/toast'
import { sellerOrderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { OrderDetailPage } from './OrderDetailPage'

const ID = sellerOrderResponse().id

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={[`/seller/orders/${ID}`]}>
      <Routes>
        <Route path="/seller/orders/:id" element={<OrderDetailPage />} />
        <Route path="/seller/returns/:id" element={<h1>Return case</h1>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S6 order detail', () => {
  it('shows the vault, the payout breakdown and the buyer masked', async () => {
    server.use(http.get(`/api/transactions/${ID}`, () => HttpResponse.json(sellerOrderResponse())))
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Ready to dispatch' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('VK-7K3P9Q')
    expect(screen.getByText('Network fee (estimated)')).toBeInTheDocument()
    expect(screen.getAllByText('KES 51,870').length).toBeGreaterThan(0)
    expect(screen.getByText('Held until the buyer accepts')).toBeInTheDocument()
    expect(screen.getByText('+254 712 *** 678')).toBeInTheDocument()
  })

  it('dispatches after the confirmation and refreshes the order', async () => {
    let status: 'locked' | 'out_for_delivery' = 'locked'
    server.use(
      http.get(`/api/transactions/${ID}`, () => HttpResponse.json(sellerOrderResponse({ status }))),
      http.post(`/api/transactions/${ID}/dispatch`, () => {
        status = 'out_for_delivery'
        return HttpResponse.json({})
      }),
    )
    const { user } = renderPage()
    await screen.findByRole('heading', { name: 'Ready to dispatch' })
    await user.click(screen.getAllByRole('button', { name: 'Mark as dispatched' })[0] as HTMLElement)
    const dialog = await screen.findByRole('alertdialog', { name: 'Mark VK-7K3P9Q as dispatched?' })
    await user.click(within(dialog).getByRole('button', { name: "Yes, it's dispatched" }))
    expect(await screen.findByRole('heading', { name: 'On the way to the buyer' })).toBeInTheDocument()
    expect(toast.current().map((t) => t.message)).toContain('Marked as dispatched')
  })

  it('refetches and explains when the order already moved on (409)', async () => {
    server.use(
      http.get(`/api/transactions/${ID}`, () =>
        HttpResponse.json(sellerOrderResponse({ status: 'out_for_delivery' })),
      ),
      http.post(`/api/transactions/${ID}/arrival`, () => HttpResponse.json({ detail: 'x' }, { status: 409 })),
    )
    const { user } = renderPage()
    await screen.findByRole('heading', { name: 'On the way to the buyer' })
    await user.click(screen.getAllByRole('button', { name: 'Mark item arrived' })[0] as HTMLElement)
    await user.click(await screen.findByRole('button', { name: 'Yes, mark arrived' }))
    await waitFor(() =>
      expect(toast.current().map((t) => t.message)).toContain("This order changed. Here's the latest."),
    )
  })

  it('shows the payout reference once paid', async () => {
    server.use(
      http.get(`/api/transactions/${ID}`, () =>
        HttpResponse.json(
          sellerOrderResponse({
            status: 'released',
            payout: {
              status: 'paid_out',
              amount: '52000.00',
              reference: 'QJK7ZX12AB',
              paid_at: '2026-10-24T11:36:00Z',
            },
          }),
        ),
      ),
    )
    renderPage()
    expect(await screen.findByText(/Paid out to M-Pesa/)).toBeInTheDocument()
    expect(screen.getByText('QJK7ZX12AB')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Mark/ })).not.toBeInTheDocument()
  })

  it('opens the return case from a dispute state', async () => {
    server.use(
      http.get(`/api/transactions/${ID}`, () =>
        HttpResponse.json(sellerOrderResponse({ status: 'return_received' })),
      ),
    )
    const { user } = renderPage()
    await user.click((await screen.findAllByRole('button', { name: 'Open return case' }))[0] as HTMLElement)
    expect(await screen.findByRole('heading', { name: 'Return case' })).toBeInTheDocument()
  })

  it("says the order isn't in this shop when it belongs to someone else", async () => {
    server.use(
      http.get(`/api/transactions/${ID}`, () =>
        HttpResponse.json({ detail: 'Transaction not found.' }, { status: 404 }),
      ),
    )
    renderPage()
    expect(await screen.findByRole('heading', { name: "This order isn't in your shop" })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Order detail' })).toBeInTheDocument()
  })

  it('offers a retry when loading fails', async () => {
    server.use(http.get(`/api/transactions/${ID}`, () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("We couldn't load this order.")).toBeInTheDocument()
  })
})
