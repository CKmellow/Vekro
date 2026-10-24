import { act, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { toast } from '@/lib/toast'
import { notificationResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { NotificationsPage } from './NotificationsPage'

const now = new Date().toISOString()
const old = new Date(Date.now() - 5 * 86_400_000).toISOString()
const unread = notificationResponse({ id: 'n-1', created_at: now })
const read = notificationResponse({
  id: 'n-2',
  title: 'Return started for VK-9F2K4D',
  event_type: 'dispute_opened',
  is_read: true,
  created_at: old,
})

const requests: URL[] = []
let marked: string[] = []
let all = [unread, read]
function serve() {
  server.use(
    http.get('/api/notifications', ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      return HttpResponse.json(url.searchParams.get('unread') ? all.filter((n) => !n.is_read) : all)
    }),
    http.post('/api/notifications/:id/read', ({ params }) => {
      marked.push(String(params.id))
      return HttpResponse.json({ ...unread, is_read: true })
    }),
    http.post('/api/notifications/read-all', () => {
      all = all.map((n) => ({ ...n, is_read: true }))
      return HttpResponse.json({ updated: 1, unread_count: 0 })
    }),
  )
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter initialEntries={['/seller/notifications']}>
      <Routes>
        <Route path="/seller/notifications" element={<NotificationsPage />} />
        <Route path="/seller/orders/:id" element={<h1>Order</h1>} />
      </Routes>
    </MemoryRouter>,
  )

beforeEach(() => {
  requests.length = 0
  marked = []
  all = [unread, read]
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S14 notifications', () => {
  it('groups by day, shows unread, and asks only for in-app notifications', async () => {
    serve()
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Earlier' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Unread: Buyer payment confirmed VK-7K3P9Q/ })).toHaveAttribute(
      'href',
      `/seller/orders/${unread.transaction_id}`,
    )
    expect(screen.getByRole('link', { name: /Return started/ })).toHaveAttribute(
      'href',
      `/seller/returns/${read.transaction_id}`,
    )
    expect(requests.every((u) => u.searchParams.get('channel') === 'in_app')).toBe(true)
  })

  it('marks a notification read when it is opened', async () => {
    serve()
    const { user } = renderPage()
    await user.click(await screen.findByRole('link', { name: /Unread: Buyer payment confirmed/ }))
    expect(await screen.findByRole('heading', { name: 'Order' })).toBeInTheDocument()
    await waitFor(() => expect(marked).toEqual(['n-1']))
  })

  it('marks all as read', async () => {
    serve()
    const { user } = renderPage()
    await screen.findByRole('heading', { name: 'Today' })
    await user.click(screen.getByRole('button', { name: 'Mark all as read' }))
    await waitFor(() => expect(toast.current().map((t) => t.message)).toContain('All caught up'))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark all as read' })).toBeDisabled())
  })

  it('filters to unread, with an empty state', async () => {
    all = [read]
    serve()
    const { user } = renderPage()
    await screen.findByRole('heading', { name: 'Earlier' })
    await user.click(screen.getByRole('radio', { name: /Unread/ }))
    expect(await screen.findByText('No unread notifications.')).toBeInTheDocument()
  })

  it("says you're all caught up with no notifications", async () => {
    all = []
    serve()
    renderPage()
    expect(await screen.findByRole('heading', { name: "You're all caught up" })).toBeInTheDocument()
  })

  it('offers a retry when loading fails', async () => {
    server.use(http.get('/api/notifications', () => HttpResponse.json({ detail: 'x' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("We couldn't load your notifications.")).toBeInTheDocument()
  })
})
