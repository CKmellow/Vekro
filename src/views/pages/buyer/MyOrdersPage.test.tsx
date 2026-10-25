import { screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { orderListResponse, orderSummaryResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { MyOrdersPage } from './MyOrdersPage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const me = (role: string) => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Wanjiru',
  phone: '+254712345678',
  role,
  mpesa_phone: null,
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
})

const bought = orderSummaryResponse({
  viewer_role: 'buyer',
  counterpart: { name: 'Amina Gadgets', phone_masked: '+254 722 *** 904' },
})

function renderAt(url = '/buyer/orders', role: string | null = 'buyer') {
  server.use(
    http.get('/api/auth/me', () =>
      role ? HttpResponse.json(me(role)) : HttpResponse.json({ detail: 'x' }, { status: 401 }),
    ),
  )
  const router = createMemoryRouter(
    [
      { path: '/buyer/orders', element: <MyOrdersPage /> },
      { path: '/buyer/sign-in', element: <h1>Sign in</h1> },
      { path: '/order/:id', element: <h1>Order page</h1> },
      { path: '/', element: <h1>Home</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('B9 my orders', () => {
  it('lists the buyer orders as cards with the seller, status and counts', async () => {
    const seen: URL[] = []
    server.use(
      http.get('/api/transactions', ({ request }) => {
        seen.push(new URL(request.url))
        return HttpResponse.json(
          orderListResponse([bought], {
            counts: { needs_action: 1, in_transit: 2, held: 0, completed: 3, issues: 1 },
          }),
        )
      }),
    )
    renderAt()
    const card = await screen.findByRole('link', { name: /iPhone 13/ })
    expect(card).toHaveAttribute('href', `/order/${bought.id}`)
    expect(within(card).getByText(/Amina Gadgets/)).toBeInTheDocument()
    expect(within(card).getByText('VK-7K3P9Q')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Active\s*3/ })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /All\s*7/ })).toBeInTheDocument()
    expect(seen[0]?.searchParams.get('segment')).toBeNull()
  })

  it('sends the active statuses as a filter and keeps it in the URL', async () => {
    const seen: URL[] = []
    server.use(
      http.get('/api/transactions', ({ request }) => {
        seen.push(new URL(request.url))
        return HttpResponse.json(orderListResponse([bought]))
      }),
    )
    const { user, router } = renderAt()
    await screen.findByRole('link', { name: /iPhone 13/ })
    await user.click(screen.getByRole('radio', { name: /Active/ }))
    await vi.waitFor(() => expect(seen.at(-1)?.searchParams.getAll('status')).toContain('hold_24h'))
    expect(router.state.location.search).toBe('?segment=active')
  })

  it('shows the empty state for a buyer with no orders', async () => {
    server.use(
      http.get('/api/transactions', () =>
        HttpResponse.json(
          orderListResponse([], {
            counts: { needs_action: 0, in_transit: 0, held: 0, completed: 0, issues: 0 },
          }),
        ),
      ),
    )
    renderAt()
    expect(await screen.findByText('No orders yet')).toBeInTheDocument()
  })

  it('offers to clear a search with no results', async () => {
    server.use(
      http.get('/api/transactions', ({ request }) =>
        HttpResponse.json(orderListResponse(new URL(request.url).searchParams.get('q') ? [] : [bought])),
      ),
    )
    renderAt('/buyer/orders?q=VK-1234')
    expect(await screen.findByText('No orders match "VK-1234"')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Clear search' })).toBeInTheDocument()
  })

  it('says when the orders fail to load', async () => {
    server.use(http.get('/api/transactions', () => HttpResponse.json({ detail: 'x' }, { status: 400 })))
    renderAt()
    expect(await screen.findByText("We couldn't load your orders.")).toBeInTheDocument()
  })

  it('sends signed-out visitors to sign in and back', async () => {
    const { router } = renderAt('/buyer/orders', null)
    await screen.findByRole('heading', { name: 'Sign in' })
    expect(router.state.location.search).toBe('?returnTo=%2Fbuyer%2Forders')
  })

  it('opens an own order by reference and refuses one that is not theirs', async () => {
    server.use(
      http.get('/api/transactions', ({ request }) => {
        const q = new URL(request.url).searchParams.get('q')
        return HttpResponse.json(orderListResponse(q === 'VK-NOPE00' ? [] : [bought]))
      }),
    )
    const { user } = renderAt()
    await screen.findByRole('link', { name: /iPhone 13/ })
    await user.click(screen.getByRole('button', { name: 'Track an order' }))
    const field = await screen.findByLabelText('Order link or reference')
    await user.type(field, 'vk-nope00')
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByText("We can't find that order in your account.")).toBeInTheDocument()
    await user.clear(field)
    await user.type(field, 'VK-7K3P9Q')
    await user.click(screen.getByRole('button', { name: 'Open' }))
    expect(await screen.findByRole('heading', { name: 'Order page' })).toBeInTheDocument()
  })

  it('signs out to the home page', async () => {
    server.use(
      http.get('/api/transactions', () => HttpResponse.json(orderListResponse([bought]))),
      http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
    )
    const { user } = renderAt()
    await screen.findByRole('link', { name: /iPhone 13/ })
    await user.click(screen.getByRole('button', { name: 'Sign out' }))
    expect(await screen.findByRole('heading', { name: 'Home' })).toBeInTheDocument()
  })
})
