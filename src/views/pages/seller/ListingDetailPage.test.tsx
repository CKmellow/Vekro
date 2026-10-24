import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { listingResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { ListingDetailPage } from './ListingDetailPage'

const SHOES = 'l-shoes'
const shoes = listingResponse({ id: SHOES, title: 'Nike Air Force 1, size 42', is_serialized: false })

function renderAt(url: string) {
  const router = createMemoryRouter(
    [
      { path: '/seller/listings/:id', element: <ListingDetailPage /> },
      { path: '/seller/listings/new', element: <h1>New listing</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

beforeEach(() => {
  let current = shoes
  server.use(
    http.get(`/api/listings/${SHOES}`, () => HttpResponse.json(current)),
    http.get('/api/listings/sold', () => HttpResponse.json(listingResponse({ id: 'sold', status: 'sold' }))),
    http.post(`/api/listings/${SHOES}/archive`, () => {
      current = { ...shoes, status: 'archived' }
      return HttpResponse.json(current)
    }),
    http.post(`/api/listings/${SHOES}/restore`, () => {
      current = shoes
      return HttpResponse.json(current)
    }),
  )
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})

describe('S9 listing detail', () => {
  it('celebrates a new listing and shares its Trust Link', async () => {
    const { user } = renderAt(`/seller/listings/${SHOES}?published=1`)
    expect(
      await screen.findByText('Your listing is live. Share the link so buyers can pay safely.'),
    ).toBeInTheDocument()
    const link = `${window.location.origin}/pay/${SHOES}`
    expect(screen.getByRole('link', { name: 'Share on WhatsApp' })).toHaveAttribute(
      'href',
      expect.stringContaining(encodeURIComponent(link)),
    )
    expect(screen.getByRole('img', { name: 'QR code for Nike Air Force 1, size 42' })).toBeInTheDocument()
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    await user.click(screen.getByRole('button', { name: 'Copy' }))
    expect(writeText).toHaveBeenCalledWith(link)
  })

  it('locks a listing with a paid order', async () => {
    renderAt('/seller/listings/sold')
    expect(await screen.findByText('This listing has a paid order')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Edit' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Archive' })).toBeDisabled()
    expect(screen.queryByRole('heading', { name: 'Your Trust Link is ready' })).not.toBeInTheDocument()
  })

  it('offers Restore and Duplicate when archived', async () => {
    const { user, router } = renderAt(`/seller/listings/${SHOES}`)
    await user.click(await screen.findByRole('button', { name: 'Archive' }))
    await user.click(await screen.findByRole('button', { name: 'Archive listing' }))
    await user.click(await screen.findByRole('button', { name: 'Restore listing' }))
    expect(await screen.findByRole('heading', { name: 'Your Trust Link is ready' })).toBeInTheDocument()
    await user.click(await screen.findByRole('button', { name: 'Archive' }))
    await user.click(await screen.findByRole('button', { name: 'Archive listing' }))
    await user.click(await screen.findByRole('button', { name: 'Duplicate as new listing' }))
    expect(`${router.state.location.pathname}${router.state.location.search}`).toBe(
      `/seller/listings/new?from=${SHOES}`,
    )
  })

  it('says when a listing does not exist', async () => {
    server.use(
      http.get('/api/listings/missing', () =>
        HttpResponse.json({ detail: 'Listing not found.' }, { status: 404 }),
      ),
    )
    renderAt('/seller/listings/missing')
    expect(await screen.findByText("We can't find this listing.")).toBeInTheDocument()
  })
})
