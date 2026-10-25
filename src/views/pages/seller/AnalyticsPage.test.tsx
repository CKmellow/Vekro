import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { AnalyticsPage } from './AnalyticsPage'

const kpis = (over: Record<string, unknown> = {}) => ({
  sales_volume: '428000.00',
  orders: 46,
  average_order_value: '9300',
  completion_rate: 0.94,
  dispute_rate: 0.02,
  average_dispatch_seconds: 24000,
  ...over,
})

const analytics = (over: Record<string, unknown> = {}) => ({
  range_days: 30,
  completed_sales: 12,
  current: kpis(),
  previous: kpis({ sales_volume: '382000.00', orders: 41, dispute_rate: 0.04 }),
  bucket: 'day',
  sales_series: [
    { date: '2026-10-24', amount: '28400.00', orders: 4 },
    { date: '2026-10-25', amount: '0', orders: 0 },
  ],
  outcomes: [{ week_start: '2026-10-20', released: 8, refunded: 1, disputed: 1 }],
  dispute_categories: [{ category: 'not_working', count: 3 }],
  top_listings: [
    {
      listing_id: 'a',
      title: 'iPhone 13',
      photo_url: null,
      orders: 4,
      sales: '208000.00',
      completion_rate: 1,
    },
    {
      listing_id: 'b',
      title: 'Air Force 1',
      photo_url: null,
      orders: 9,
      sales: '58500.00',
      completion_rate: 0.9,
    },
  ],
  server_time: '2026-10-26T09:00:00Z',
  ...over,
})

function renderAt(url = '/seller/analytics', body: object = analytics()) {
  const seen: string[] = []
  server.use(
    http.get('/api/seller/analytics', ({ request }) => {
      seen.push(new URL(request.url).searchParams.get('range') ?? '')
      return HttpResponse.json(body)
    }),
  )
  const router = createMemoryRouter([{ path: '/seller/analytics', element: <AnalyticsPage /> }], {
    initialEntries: [url],
  })
  return { seen, router, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('S12 analytics', () => {
  it('shows the KPIs with deltas, coloured by whether the change is good', async () => {
    renderAt()
    expect(await screen.findByText('KES 428,000')).toBeInTheDocument()
    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByText('+5')).toBeInTheDocument()
    expect(screen.getByText('94%')).toBeInTheDocument()
    expect(screen.getByText('6h 40m')).toBeInTheDocument()
    // A falling dispute rate is good news.
    expect(screen.getByText('-2 pts').closest('span')).toHaveClass('text-emerald-700')
  })

  it('summarises sales for screen readers and offers a table', async () => {
    const { user } = renderAt()
    expect(
      await screen.findByRole('img', { name: /KES 428,000 released over 30 days, up from KES 382,000/ }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'View as table' }))
    expect(screen.getByRole('table', { name: 'Sales by day' })).toHaveTextContent('KES 28,400')
  })

  it('toggles outcome series and sorts top listings', async () => {
    const { user } = renderAt()
    const released = await screen.findByRole('button', { name: 'Released' })
    expect(released).toHaveAttribute('aria-pressed', 'true')
    await user.click(released)
    expect(released).toHaveAttribute('aria-pressed', 'false')

    const rows = () => screen.getAllByRole('row').map((r) => r.textContent ?? '')
    expect(rows().findIndex((r) => r.includes('Air Force 1'))).toBeLessThan(
      rows().findIndex((r) => r.includes('iPhone 13')),
    )
    await user.click(screen.getByRole('button', { name: 'Sales' }))
    expect(rows().findIndex((r) => r.includes('iPhone 13'))).toBeLessThan(
      rows().findIndex((r) => r.includes('Air Force 1')),
    )
  })

  it('switches the range through the URL', async () => {
    const { user, seen, router } = renderAt()
    await screen.findByText('KES 428,000')
    await user.click(screen.getByRole('radio', { name: '90 days' }))
    expect(router.state.location.search).toBe('?range=90d')
    expect(seen).toContain('90d')
  })

  it('stays locked until 5 completed sales', async () => {
    renderAt('/seller/analytics', analytics({ completed_sales: 2 }))
    expect(await screen.findByText('Make 5 sales to unlock analytics')).toBeInTheDocument()
    expect(screen.getByText(/You've made 2/)).toBeInTheDocument()
  })

  it('says when analytics fail to load', async () => {
    server.use(http.get('/api/seller/analytics', () => HttpResponse.json({ detail: 'x' }, { status: 400 })))
    const router = createMemoryRouter([{ path: '/a', element: <AnalyticsPage /> }], {
      initialEntries: ['/a'],
    })
    renderWithProviders(<RouterProvider router={router} />)
    expect(await screen.findByText("We couldn't load your analytics.")).toBeInTheDocument()
  })
})
