import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { toast } from '@/lib/toast'
import { orderListResponse, orderSummaryResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { OrdersPage } from './OrdersPage'

const shoes = orderSummaryResponse({
  id: 'b0000000-0000-4000-8000-000000000002',
  reference: 'VK-3M8D2L',
  status: 'out_for_delivery',
  amount: '6500.00',
  listing: { id: 'l2', title: 'Nike Air Force 1 size 42', is_serialized: false, photo_url: null },
  counterpart: { name: 'Wanjiku', phone_masked: '+254 733 *** 111' },
  deadlines: {},
})

function Where() {
  return <p data-testid="where">{useLocation().search}</p>
}

const renderPage = (entry = '/seller/orders') =>
  renderWithProviders(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/seller/orders"
          element={
            <>
              <OrdersPage />
              <Where />
            </>
          }
        />
        <Route path="/seller/orders/:id" element={<p>Order detail</p>} />
      </Routes>
    </MemoryRouter>,
  )

const requests: URL[] = []
function serveOrders(body = orderListResponse([orderSummaryResponse(), shoes])) {
  server.use(
    http.get('/api/transactions', ({ request }) => {
      requests.push(new URL(request.url))
      return HttpResponse.json(body)
    }),
  )
}

beforeEach(() => {
  requests.length = 0
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S5 orders list', () => {
  it('shows rows with seller labels, masked buyers, deadlines and segment counts', async () => {
    serveOrders(
      orderListResponse([orderSummaryResponse(), shoes], {
        counts: { needs_action: 2, in_transit: 1, held: 0, completed: 31, issues: 1 },
      }),
    )
    renderPage()
    const table = await screen.findByRole('table', { name: 'Orders' })
    expect(within(table).getByText('Paid, ready to dispatch')).toBeInTheDocument()
    expect(within(table).getByText('+254 712 *** 678')).toBeInTheDocument()
    expect(within(table).getByText(/left to dispatch/)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Completed\s*31/ })).toBeInTheDocument()
    expect(screen.getByText('35')).toBeInTheDocument()
    expect(requests[0]?.searchParams.get('segment')).toBe('needs_action')
  })

  it('keeps segment, search and sort in the URL and sends them to the API', async () => {
    serveOrders()
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'Orders' })
    await user.click(screen.getByRole('radio', { name: /Completed/ }))
    await waitFor(() => expect(screen.getByTestId('where')).toHaveTextContent('segment=completed'))
    await user.type(screen.getByRole('searchbox', { name: 'Search orders' }), 'iphone')
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('q')).toBe('iphone'), { timeout: 2000 })
    await user.click(screen.getByRole('button', { name: /Amount/ }))
    await waitFor(() => expect(requests.at(-1)?.searchParams.get('sort')).toBe('amount_asc'))
    expect(requests.at(-1)?.searchParams.get('segment')).toBe('completed')
  })

  it('reads its filters from the URL', async () => {
    serveOrders()
    renderPage('/seller/orders?segment=issues&q=VK-7K&page=2')
    await screen.findByRole('table', { name: 'Orders' })
    expect(Object.fromEntries(requests[0]?.searchParams ?? [])).toMatchObject({
      segment: 'issues',
      q: 'VK-7K',
      page: '2',
      page_size: '20',
    })
  })

  it('dispatches from the row after a confirmation', async () => {
    serveOrders()
    let dispatched = ''
    server.use(
      http.post('/api/transactions/:id/dispatch', ({ params }) => {
        dispatched = String(params.id)
        return HttpResponse.json({})
      }),
    )
    const { user } = renderPage()
    await screen.findByRole('table', { name: 'Orders' })
    const table = screen.getByRole('table', { name: 'Orders' })
    await user.click(within(table).getByRole('button', { name: 'Dispatch VK-7K3P9Q' }))
    const dialog = await screen.findByRole('alertdialog', { name: 'Mark VK-7K3P9Q as dispatched?' })
    expect(within(dialog).getByRole('button', { name: 'Not yet' })).toHaveFocus()
    await user.click(within(dialog).getByRole('button', { name: "Yes, it's dispatched" }))
    await waitFor(() => expect(dispatched).toBe(orderSummaryResponse().id))
    await waitFor(() => expect(toast.current().map((t) => t.message)).toContain('Marked as dispatched'))
    await waitFor(() => expect(requests.length).toBeGreaterThan(1))
  })

  it('tells the seller when the order moved on (409)', async () => {
    serveOrders()
    server.use(
      http.post('/api/transactions/:id/arrival', () =>
        HttpResponse.json({ detail: 'Invalid state.' }, { status: 409 }),
      ),
    )
    const { user } = renderPage()
    const table = await screen.findByRole('table', { name: 'Orders' })
    await user.click(within(table).getByRole('button', { name: 'Mark arrived VK-3M8D2L' }))
    await user.click(await screen.findByRole('button', { name: 'Yes, mark arrived' }))
    await waitFor(() =>
      expect(toast.current().map((t) => t.message)).toContain("This order changed. Here's the latest."),
    )
  })

  it('has a friendly empty state when there are no orders at all', async () => {
    serveOrders(
      orderListResponse([], { counts: { needs_action: 0, in_transit: 0, held: 0, completed: 0, issues: 0 } }),
    )
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No orders yet' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to listings' })).toBeInTheDocument()
  })

  it('explains an empty segment, and a search with no results', async () => {
    serveOrders(
      orderListResponse([], { counts: { needs_action: 0, in_transit: 0, held: 0, completed: 4, issues: 0 } }),
    )
    const { unmount } = renderPage()
    expect(await screen.findByText('Nothing needs your action')).toBeInTheDocument()
    unmount()
    renderPage('/seller/orders?q=VK-1234')
    expect(await screen.findByText('No orders match "VK-1234"')).toBeInTheDocument()
  })

  it('offers a retry when the list fails to load', async () => {
    server.use(http.get('/api/transactions', () => HttpResponse.json({ detail: 'Boom' }, { status: 500 })))
    const { user } = renderPage()
    expect(await screen.findByText("We couldn't load your orders.")).toBeInTheDocument()
    serveOrders()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('table', { name: 'Orders' })).toBeInTheDocument()
  })
})
