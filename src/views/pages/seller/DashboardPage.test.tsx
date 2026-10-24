import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { toast } from '@/lib/toast'
import {
  listingListResponse,
  listingResponse,
  orderListResponse,
  orderSummaryResponse,
  sellerSummaryResponse,
} from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { signedInAs } from '@/test/session'
import { DashboardPage } from './DashboardPage'

const COUNTS = { needs_action: 1, in_transit: 2, held: 1, completed: 31, issues: 1 }

function serve({ needs = [orderSummaryResponse()], counts = COUNTS, listings = 5 } = {}) {
  signedInAs('seller')
  server.use(
    http.get('/api/transactions/summary', () => HttpResponse.json(sellerSummaryResponse())),
    http.get('/api/transactions', ({ request }) =>
      new URL(request.url).searchParams.get('segment') === 'needs_action'
        ? HttpResponse.json(orderListResponse(needs, { counts }))
        : HttpResponse.json(orderListResponse([orderSummaryResponse()], { counts })),
    ),
    http.get('/api/listings', () =>
      HttpResponse.json(listingListResponse(Array.from({ length: listings }, () => listingResponse()))),
    ),
  )
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <DashboardPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S4 dashboard', () => {
  it('greets the seller and shows the KPIs with the month delta', async () => {
    serve()
    renderPage()
    expect(await screen.findByRole('link', { name: /In escrow/ })).toHaveAttribute(
      'href',
      '/seller/orders?segment=in_transit',
    )
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      /^Good (morning|afternoon|evening), Amina$/,
    )
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Open issues/ })).toHaveAttribute(
      'href',
      '/seller/orders?segment=issues',
    )
    expect(screen.getByText('Held for 5 orders')).toBeInTheDocument()
  })

  it('lists what needs action and dispatches from the card', async () => {
    serve()
    let dispatched = false
    server.use(
      http.post('/api/transactions/:id/dispatch', () => {
        dispatched = true
        return HttpResponse.json({})
      }),
    )
    const { user } = renderPage()
    const section = await screen.findByRole('region', { name: /Needs your action/ })
    expect(within(section).getByText('Dispatch VK-7K3P9Q before the timer runs out')).toBeInTheDocument()
    await user.click(within(section).getByRole('button', { name: 'Mark as dispatched VK-7K3P9Q' }))
    await user.click(await screen.findByRole('button', { name: "Yes, it's dispatched" }))
    await waitFor(() => expect(dispatched).toBe(true))
  })

  it("says you're all caught up when nothing needs action", async () => {
    serve({ needs: [] })
    renderPage()
    expect(await screen.findByRole('heading', { name: "You're all caught up" })).toBeInTheDocument()
    expect(screen.queryByText(/Tip:/)).not.toBeInTheDocument()
  })

  it('shows the getting-started checklist to a seller with no orders', async () => {
    serve({
      needs: [],
      counts: { needs_action: 0, in_transit: 0, held: 0, completed: 0, issues: 0 },
      listings: 1,
    })
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Get ready to sell' })).toBeInTheDocument()
    expect(screen.getByText('2 of 3 done')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Share your Trust Link.*to do/ })).toBeInTheDocument()
  })

  it('offers a tip while the seller has few listings', async () => {
    serve({ listings: 1 })
    renderPage()
    expect(await screen.findByText(/Add a second photo/)).toBeInTheDocument()
  })

  it('offers a retry when the dashboard fails to load', async () => {
    serve()
    server.use(
      http.get('/api/transactions/summary', () => HttpResponse.json({ detail: 'x' }, { status: 500 })),
    )
    renderPage()
    expect(await screen.findByText("We couldn't load your dashboard.")).toBeInTheDocument()
  })
})
