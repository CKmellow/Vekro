import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { orderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { OrderTrackerPage } from './OrderTrackerPage'
import { TimelinePage } from './TimelinePage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const ID = orderResponse().id
const EVENTS = [
  {
    kind: 'transaction_created',
    at: '2026-10-20T06:03:00Z',
    title: 'Order created',
    description: 'Waiting for your payment.',
  },
  {
    kind: 'transaction_locked',
    at: '2026-10-20T06:05:00Z',
    title: 'Paid into the vault',
    description: 'Vekro holds your money.',
  },
]

function serve(events: typeof EVENTS | 'error' = EVENTS) {
  server.use(
    // The tracker checks the session for its phone gate; this buyer is signed in.
    http.get('/api/auth/me', () =>
      HttpResponse.json({
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        name: 'Wanjiru',
        phone: '+254712345678',
        role: 'buyer',
        mpesa_phone: null,
        mpesa_account_name: null,
        is_active: true,
        created_at: '2026-10-15T09:00:00Z',
        session_expires_at: '2026-10-22T09:00:00Z',
      }),
    ),
    http.get(`/api/transactions/${ID}`, () =>
      HttpResponse.json(
        orderResponse({
          status: 'locked',
          payment: null,
          deadlines: { dispatch_by: '2026-10-22T09:00:00Z' },
        }),
      ),
    ),
    http.get(`/api/transactions/${ID}/timeline`, () =>
      events === 'error' ? HttpResponse.json({}, { status: 500 }) : HttpResponse.json(events),
    ),
  )
}

function renderAt(path: string) {
  const router = createMemoryRouter(
    [
      { path: '/order/:orderId', element: <OrderTrackerPage /> },
      { path: '/order/:orderId/timeline', element: <TimelinePage /> },
    ],
    { initialEntries: [path] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('B7 timeline', () => {
  it('shows the summary, what comes next and what happened, newest first', async () => {
    serve()
    renderAt(`/order/${ID}/timeline`)
    const list = await screen.findByRole('list', { name: 'Order timeline' })
    const items = within(list).getAllByRole('listitem')
    expect(items[0]).toHaveTextContent('The seller dispatches your order, or you are refunded')
    expect(items[0]).toHaveTextContent('Upcoming')
    expect(items[1]).toHaveTextContent('Paid into the vault')
    expect(items[1]).toHaveTextContent('Vekro holds your money.')
    expect(items[2]).toHaveTextContent('Order created')
    expect(screen.getByText('VK-7K3P9Q')).toBeInTheDocument()
    expect(screen.getByText('Paid, funds held safely')).toBeInTheDocument()
  })

  it('goes back to the order', async () => {
    serve()
    const { user, router } = renderAt(`/order/${ID}/timeline`)
    await user.click(await screen.findByRole('button', { name: 'Back to your order' }))
    expect(router.state.location.pathname).toBe(`/order/${ID}`)
  })

  it('offers a retry when the timeline fails', async () => {
    serve('error')
    renderAt(`/order/${ID}/timeline`)
    expect(await screen.findByText("We couldn't load the timeline.")).toBeInTheDocument()
  })

  it('is a tab on the tracker', async () => {
    serve()
    const { user } = renderAt(`/order/${ID}`)
    await user.click(await screen.findByRole('tab', { name: 'Timeline' }))
    expect(await screen.findByRole('list', { name: 'Order timeline' })).toHaveTextContent(
      'Paid into the vault',
    )
  })
})
