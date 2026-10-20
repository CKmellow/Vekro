import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { orderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { OrderTrackerPage } from './OrderTrackerPage'

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

function renderTracker() {
  const router = createMemoryRouter(
    [
      { path: '/order/:orderId', element: <OrderTrackerPage /> },
      { path: '/order/:orderId/:screen', element: <h1>Next screen</h1> },
    ],
    { initialEntries: [`/order/${ID}`] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true, now: new Date(NOW) }))
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

  it('refetches every 15 seconds while active and moves to the next state', async () => {
    const reads = serve({ status: 'out_for_delivery' }, { status: 'at_door_pending_inspection' })
    renderTracker()
    await screen.findByRole('heading', { name: 'Waiting for the courier' })
    await act(() => vi.advanceTimersByTimeAsync(15_100))
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
})
