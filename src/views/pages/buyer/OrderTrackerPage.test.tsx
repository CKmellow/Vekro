import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { orderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { OrderTrackerPage } from './OrderTrackerPage'

// Reduced motion: state changes swap at once, as the design specifies for that setting.
vi.mock('motion/react', async (original) => ({
  ...(await original<object>()),
  useReducedMotion: () => true,
}))

const ID = orderResponse().id
const NOW = '2026-10-20T09:00:00Z'

function serve(...responses: Parameters<typeof orderResponse>[0][]) {
  let i = 0
  const reads = { count: 0 }
  server.use(
    http.get(`/api/transactions/${ID}`, () => {
      reads.count += 1
      return HttpResponse.json(
        orderResponse({ server_time: NOW, payment: null, ...responses[Math.min(i++, responses.length - 1)] }),
      )
    }),
  )
  return reads
}

const BUYER = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Wanjiru',
  phone: '+254712345678',
  role: 'buyer',
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
}

function renderTracker(signedIn = true) {
  server.use(
    http.get('/api/auth/me', () =>
      signedIn ? HttpResponse.json(BUYER) : HttpResponse.json({ detail: 'x' }, { status: 401 }),
    ),
  )
  const router = createMemoryRouter(
    [
      { path: '/order/:orderId', element: <OrderTrackerPage /> },
      { path: '/order/:orderId/:screen', element: <h1>Next screen</h1> },
    ],
    { initialEntries: [`/order/${ID}`] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

// Fake timers and Date only: animation frames stay real so motion's cross-fade completes.
beforeEach(() =>
  vi.useFakeTimers({
    shouldAdvanceTime: true,
    now: new Date(NOW),
    toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'Date'],
  }),
)
afterEach(() => vi.useRealTimers())

describe('B3 order tracker', () => {
  it('shows where the money is and what happens next while waiting for dispatch', async () => {
    serve({ status: 'locked', deadlines: { dispatch_by: '2026-10-22T09:00:00Z' } })
    renderTracker()
    expect(
      await screen.findByRole('heading', { name: 'Waiting for the seller to dispatch' }),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Paid, funds held safely').length).toBeGreaterThan(0)
    expect(screen.getAllByText('VK-7K3P9Q').length).toBeGreaterThan(0)
    expect(screen.getByRole('timer', { name: /Time left to dispatch/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Inspect and confirm' })).not.toBeInTheDocument()
  })

  it.each([
    ['awaiting_payment', 'Finish paying to lock your order'],
    ['at_door_pending_inspection', 'Your item has arrived'],
    ['hold_24h', 'Funds held for 24 hours'],
    ['disputed_functional', 'Send the item back to the seller'],
    ['awaiting_buyer_reconfirmation', 'Is it fixed?'],
    ['resolved_split', 'Settled by Vekro support'],
  ] as const)('%s explains the next step', async (status, heading) => {
    serve({ status })
    renderTracker()
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it.each([
    ['out_for_delivery', 'Waiting for the courier'],
    ['escalated_admin_review', 'Vekro support is reviewing this'],
    ['released', 'All done'],
    ['refunded_buyer', 'Your refund is on its way'],
  ] as const)('%s says where things stand', async (status, heading) => {
    serve({ status })
    renderTracker()
    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument()
  })

  it.each([
    ['awaiting_payment', 'Pay now', 'payment'],
    ['at_door_pending_inspection', 'Inspect and confirm', 'inspect'],
    ['hold_24h', 'Report a problem', 'report'],
    ['disputed_functional', 'Continue', 'return'],
    ['awaiting_buyer_reconfirmation', 'Continue', 'return'],
  ] as const)('%s offers one action: %s', async (status, action, screenName) => {
    serve({ status })
    const { user, router } = renderTracker()
    await user.click(await screen.findByRole('button', { name: action }))
    expect(router.state.location.pathname).toBe(`/order/${ID}/${screenName}`)
    expect(
      screen.queryAllByRole('button', { name: /Pay now|Inspect and confirm|Report a problem|Continue/ }),
    ).toHaveLength(0)
  })

  it.each(['locked', 'out_for_delivery', 'escalated_admin_review', 'released', 'refunded_buyer'] as const)(
    '%s has no dock action',
    async (status) => {
      serve({ status })
      renderTracker()
      await screen.findByRole('region', { name: 'Next step' })
      expect(
        screen.queryByRole('button', { name: /Pay now|Inspect and confirm|Report a problem|Continue/ }),
      ).not.toBeInTheDocument()
    },
  )

  it('marks a derived deadline as approximate', async () => {
    serve({ status: 'at_door_pending_inspection', updated_at: NOW })
    renderTracker()
    expect(await screen.findByText(/Times are approximate\./)).toBeInTheDocument()
  })

  it('refetches every 15 seconds while active and moves to the next state', async () => {
    const reads = serve({ status: 'out_for_delivery' }, { status: 'at_door_pending_inspection' })
    renderTracker()
    await screen.findByRole('heading', { name: 'Waiting for the courier' })
    await act(() => vi.advanceTimersByTimeAsync(15_100))
    // Let the next-step card cross-fade (220ms).
    await act(() => vi.advanceTimersByTimeAsync(500))
    expect(await screen.findByRole('heading', { name: 'Your item has arrived' })).toBeInTheDocument()
    expect(reads.count).toBe(2)
  })

  it('stops polling a finished order', async () => {
    const reads = serve({ status: 'released' })
    renderTracker()
    await screen.findByRole('heading', { name: 'All done' })
    await act(() => vi.advanceTimersByTimeAsync(31_000))
    expect(reads.count).toBe(1)
  })

  it('keeps the last state, dimmed, when offline', async () => {
    serve({ status: 'locked' })
    renderTracker()
    await screen.findByRole('heading', { name: 'Waiting for the seller to dispatch' })
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    act(() => window.dispatchEvent(new Event('offline')))
    expect(await screen.findByText("You're offline.")).toBeInTheDocument()
    expect(screen.getByText(/Showing the last update at/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Waiting for the seller to dispatch' })).toBeInTheDocument()
    // TanStack Query pauses on 'offline' until 'online'; restore it for the next tests.
    onLine.mockReturnValue(true)
    act(() => window.dispatchEvent(new Event('online')))
  })

  it("never shows another person's order", async () => {
    server.use(http.get(`/api/transactions/${ID}`, () => HttpResponse.json({ detail: 'x' }, { status: 404 })))
    renderTracker()
    expect(await screen.findByRole('heading', { name: "We can't find this order" })).toBeInTheDocument()
  })

  it('gates a signed-out visitor behind an SMS code, showing only the public summary', async () => {
    let signedIn = false
    server.use(
      http.get('/api/auth/me', () =>
        signedIn ? HttpResponse.json(BUYER) : HttpResponse.json({ detail: 'x' }, { status: 401 }),
      ),
      http.get(`/api/transactions/${ID}`, () =>
        signedIn
          ? HttpResponse.json(orderResponse({ server_time: NOW, payment: null, status: 'locked' }))
          : HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
      ),
      http.get(`/api/public/orders/${ID}`, () =>
        HttpResponse.json({
          reference: 'VK-7K3P9Q',
          listing_title: 'iPhone 13, 128GB, Midnight',
          amount: '52000.00',
          state_group: 'paid',
          listing_status: 'sold',
        }),
      ),
      http.post('/api/auth/phone/request-code', () =>
        HttpResponse.json({ resend_after_seconds: 30, expires_at: NOW, dev_code: null }, { status: 202 }),
      ),
      http.post('/api/auth/phone/verify', () => {
        signedIn = true
        return HttpResponse.json(BUYER)
      }),
    )
    const router = createMemoryRouter([{ path: '/order/:orderId', element: <OrderTrackerPage /> }], {
      initialEntries: [`/order/${ID}`],
    })
    const { user } = renderWithProviders(<RouterProvider router={router} />)

    expect(await screen.findByRole('heading', { name: "Confirm it's you" })).toBeInTheDocument()
    expect(await screen.findByText('VK-7K3P9Q')).toBeInTheDocument()
    expect(screen.queryByText(/Amina|Brian/)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText('Phone number'), '712345678')
    await user.click(screen.getByRole('button', { name: 'Show my order' }))
    await user.type(await screen.findByLabelText('Digit 1 of 6'), '482913')
    expect(await screen.findByRole('heading', { name: 'Your order' }, { timeout: 4000 })).toBeInTheDocument()
    expect(screen.getAllByText('Paid, funds held safely').length).toBeGreaterThan(0)
    expect(screen.queryByRole('heading', { name: "Confirm it's you" })).not.toBeInTheDocument()
  })
})
