import { act, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { MemoryRouter } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { listingListResponse, listingResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ListingsPage } from './ListingsPage'

const shoes = listingResponse({
  id: 'l-shoes',
  title: 'Nike Air Force 1, size 42',
  price: '6500.00',
  is_serialized: false,
})
const dress = listingResponse({
  id: 'l-dress',
  title: 'Kitenge wrap dress',
  price: '3200.00',
  is_serialized: false,
})
const sofa = listingResponse({ id: 'l-sofa', title: '3-seater sofa', status: 'awaiting_payment' })
const COUNTS = { active: 2, awaiting_payment: 1, sold: 1, archived: 0 }

const requests: URL[] = []
function serveListings() {
  server.use(
    http.get('/api/listings', ({ request }) => {
      const url = new URL(request.url)
      requests.push(url)
      const status = url.searchParams.get('status')
      const q = url.searchParams.get('q')?.toLowerCase()
      const items = [shoes, dress, sofa].filter(
        (l) => (!status || l.status === status) && (!q || l.title.toLowerCase().includes(q)),
      )
      return HttpResponse.json(listingListResponse(items, COUNTS))
    }),
  )
}

const renderPage = () =>
  renderWithProviders(
    <MemoryRouter>
      <ListingsPage />
    </MemoryRouter>,
  )

beforeEach(() => {
  requests.length = 0
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S8 listings', () => {
  it('shows active listings with the server counts, filters and search', async () => {
    serveListings()
    const { user } = renderPage()
    const list = await screen.findByRole('list', { name: 'Listings' })
    expect(within(list).getByText('Nike Air Force 1, size 42')).toBeInTheDocument()
    expect(within(list).queryByText('3-seater sofa')).not.toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /Sold\s*1/ })).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: /draft/i })).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Waiting for payment|Awaiting payment/ }))
    expect(await screen.findByText('3-seater sofa')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /Active/ }))
    await user.type(screen.getByRole('searchbox', { name: 'Search listings' }), 'zzz')
    expect(await screen.findByText('No listings match "zzz"')).toBeInTheDocument()
    expect(requests.at(-1)?.searchParams.get('q')).toBe('zzz')
  })

  it('invites a first listing when the seller has none', async () => {
    server.use(
      http.get('/api/listings', () =>
        HttpResponse.json(listingListResponse([], { active: 0, awaiting_payment: 0, sold: 0, archived: 0 })),
      ),
    )
    renderPage()
    expect(await screen.findByRole('heading', { name: 'Create your first listing' })).toBeInTheDocument()
  })

  it('offers a retry when the list fails', async () => {
    server.use(http.get('/api/listings', () => HttpResponse.json({ detail: 'Boom' }, { status: 500 })))
    renderPage()
    expect(await screen.findByText("We couldn't load your listings.")).toBeInTheDocument()
  })

  it('copies a link with a toast', async () => {
    serveListings()
    const { user } = renderPage()
    // userEvent installs its own clipboard on setup; replace it after rendering.
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    const list = await screen.findByRole('list', { name: 'Listings' })
    await user.click(within(list).getAllByRole('button', { name: 'Copy link' })[0] as HTMLElement)
    expect(writeText).toHaveBeenCalledWith(expect.stringMatching(/\/pay\/l-shoes$/))
    expect(toast.current().at(-1)?.message).toBe('Link copied')
  })

  it('archives after confirming', async () => {
    serveListings()
    let archived = ''
    server.use(
      http.post('/api/listings/:id/archive', ({ params }) => {
        archived = String(params.id)
        return HttpResponse.json({ ...dress, status: 'archived' })
      }),
    )
    const { user } = renderPage()
    await screen.findByRole('list', { name: 'Listings' })
    await user.click(screen.getByRole('button', { name: 'More actions for Kitenge wrap dress' }))
    await user.click(screen.getByRole('button', { name: 'Archive' }))
    await user.click(await screen.findByRole('button', { name: 'Archive listing' }))
    await waitFor(() =>
      expect(toast.current().at(-1)?.message).toBe('Archived. The link no longer takes payments.'),
    )
    expect(archived).toBe('l-dress')
  })
})
