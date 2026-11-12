import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { orderSummaryResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { BuyerHomePage } from './BuyerHomePage'

const me = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Wanjiru Kamau',
  phone: '+254712345678',
  role: 'buyer',
  account_type: 'member',
  store: { status: 'none', name: null, opened_at: null, closed_at: null, payout_ready: false },
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
  sms_login_enabled: true,
}

const atDoor = orderSummaryResponse({ viewer_role: 'buyer', status: 'at_door_pending_inspection' })

function renderHome(home: object) {
  server.use(
    http.get('/api/auth/me', () => HttpResponse.json(me)),
    http.get('/api/buyer/home', () => HttpResponse.json(home)),
  )
  const router = createMemoryRouter([{ path: '/buyer', element: <BuyerHomePage /> }], {
    initialEntries: ['/buyer'],
  })
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('B10 buyer home', () => {
  it('shows what needs the buyer, recent orders and Start selling', async () => {
    renderHome({
      needs_you: [{ kind: 'at_door', due_at: '2026-10-24T10:00:00Z', order: atDoor }],
      recent: [atDoor],
      counts: { active: 1, completed: 0, refunded: 0, disputed: 0, cases: 0 },
      server_time: '2026-10-24T09:00:00Z',
    })
    expect(await screen.findByRole('heading', { name: 'Hi, Wanjiru' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Your item is at the door' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Inspect/ })).toHaveAttribute(
      'href',
      `/order/${atDoor.id}/inspect`,
    )
    expect(screen.getByRole('link', { name: 'See all orders' })).toHaveAttribute('href', '/buyer/orders')
    expect(screen.getByRole('link', { name: /Sell on Vekro too/ })).toHaveAttribute(
      'href',
      '/buyer/start-selling',
    )
  })

  it('says when nothing needs the buyer and there are no orders', async () => {
    renderHome({ needs_you: [], recent: [], counts: {}, server_time: '2026-10-24T09:00:00Z' })
    expect(await screen.findByText("You're all caught up")).toBeInTheDocument()
    expect(screen.getByText('No orders yet')).toBeInTheDocument()
  })

  it('says when the home fails to load', async () => {
    server.use(
      http.get('/api/auth/me', () => HttpResponse.json(me)),
      http.get('/api/buyer/home', () => HttpResponse.json({ detail: 'x' }, { status: 400 })),
    )
    const router = createMemoryRouter([{ path: '/buyer', element: <BuyerHomePage /> }], {
      initialEntries: ['/buyer'],
    })
    renderWithProviders(<RouterProvider router={router} />)
    expect(await screen.findByText("We couldn't load your home.")).toBeInTheDocument()
  })
})
