import { screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { orderListResponse, orderSummaryResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ReturnsPage } from './ReturnsPage'

const inTransit = orderSummaryResponse({
  id: 'r1',
  reference: 'VK-9F2K4D',
  status: 'return_in_transit',
  dispute_category: 'not_working',
  deadlines: { return_confirm_by: new Date(Date.now() + 2 * 86_400_000).toISOString() },
})
const received = orderSummaryResponse({
  id: 'r2',
  reference: 'VK-2H7N5R',
  status: 'return_received',
  dispute_category: 'damaged_on_arrival',
  deadlines: {},
})
const doorRefund = orderSummaryResponse({
  id: 'r3',
  reference: 'VK-DOOR01',
  status: 'refunded_buyer',
  deadlines: {},
})
const returnRefund = orderSummaryResponse({
  id: 'r4',
  reference: 'VK-RFND01',
  status: 'resolved_refund',
  dispute_category: 'missing_parts',
  deadlines: {},
})
const STATUS_COUNTS = { return_in_transit: 1, return_received: 1, refunded_buyer: 1, resolved_refund: 1 }

const requests: URL[] = []
function serve(
  all = [inTransit, received, doorRefund, returnRefund],
  statusCounts: Record<string, number> = STATUS_COUNTS,
) {
  server.use(
    http.get('/api/transactions', ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      const wanted = url.searchParams.getAll('status')
      return HttpResponse.json(
        orderListResponse(
          all.filter((o) => wanted.includes(o.status)),
          { status_counts: statusCounts },
        ),
      )
    }),
  )
}

const renderPage = (entry = '/seller/returns') =>
  renderWithProviders(
    <MemoryRouter initialEntries={[entry]}>
      <ReturnsPage />
    </MemoryRouter>,
  )

describe('S10 returns inbox', () => {
  it('shows cases waiting to come back, with the category and the receipt countdown', async () => {
    serve()
    renderPage()
    const list = await screen.findByRole('list', { name: 'Return cases' })
    expect(within(list).getByText("Doesn't work properly")).toBeInTheDocument()
    expect(within(list).getByText('VK-9F2K4D')).toBeInTheDocument()
    expect(
      within(list).getByRole('timer', { name: /Confirm receipt, or it goes to Vekro support/ }),
    ).toBeInTheDocument()
    expect(within(list).getByRole('link', { name: 'Open case for VK-9F2K4D' })).toHaveAttribute(
      'href',
      '/seller/returns/r1',
    )
    expect(screen.getByRole('tab', { name: 'Awaiting return (1)' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Action needed (1)' })).toBeInTheDocument()
    expect(requests[0]?.searchParams.getAll('status')).toEqual(['disputed_functional', 'return_in_transit'])
  })

  it('switches tabs and keeps only real returns under Closed', async () => {
    serve()
    const { user } = renderPage()
    await screen.findByRole('list', { name: 'Return cases' })
    await user.click(screen.getByRole('tab', { name: 'Action needed (1)' }))
    expect(await screen.findByText('VK-2H7N5R')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: 'Closed' }))
    await waitFor(() => expect(screen.getByText('VK-RFND01')).toBeInTheDocument())
    expect(screen.queryByText('VK-DOOR01')).not.toBeInTheDocument()
  })

  it('explains an empty tab', async () => {
    serve([received], { return_received: 1 })
    renderPage()
    expect(await screen.findByText('No items on their way back.')).toBeInTheDocument()
  })

  it('says there are no returns at all', async () => {
    serve([], {})
    renderPage()
    expect(await screen.findByRole('heading', { name: 'No returns. Good sign.' })).toBeInTheDocument()
  })

  it('offers a retry when loading fails', async () => {
    server.use(http.get('/api/transactions', () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("We couldn't load your returns.")).toBeInTheDocument()
  })
})
