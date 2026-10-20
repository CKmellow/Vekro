import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { listingResponse, orderResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { InspectionPage } from './InspectionPage'

vi.mock('motion/react', async (original) => ({ ...(await original<object>()), useReducedMotion: () => true }))

const ID = orderResponse().id
const LISTING = listingResponse().id
const AT_DOOR = {
  status: 'at_door_pending_inspection',
  deadlines: { inspect_by: '2026-10-20T10:00:00Z' },
} as const

function renderInspect(
  order: Parameters<typeof orderResponse>[0],
  listing: Parameters<typeof listingResponse>[0] = {},
) {
  server.use(
    http.get(`/api/transactions/${ID}`, () => HttpResponse.json(orderResponse({ payment: null, ...order }))),
    http.get(`/api/listings/${LISTING}`, () => HttpResponse.json(listingResponse(listing))),
  )
  const router = createMemoryRouter(
    [
      { path: '/order/:orderId/inspect', element: <InspectionPage /> },
      { path: '/order/:orderId', element: <h1>Order tracker</h1> },
    ],
    { initialEntries: [`/order/${ID}/inspect`] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

describe('B4 arrival and inspection', () => {
  it('tells the buyer the item arrived, with the time left', async () => {
    renderInspect(AT_DOOR)
    expect(await screen.findByRole('heading', { name: 'Your item has arrived' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Inspect before you confirm' })).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: /Time left to inspect/ })).toBeInTheDocument()
  })

  it('adds the serial number check for serial-numbered items, guidance only', async () => {
    const { user } = renderInspect(AT_DOOR)
    expect(
      await screen.findByRole('checkbox', { name: 'Serial number matches ••••1234' }),
    ).toBeInTheDocument()
    expect(screen.getByText('0 of 4 checked')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: 'Nothing is damaged or missing' }))
    expect(screen.getByText('1 of 4 checked')).toBeInTheDocument()
    expect(
      screen.getByText('Payment is held for 24 hours; you can report a functional issue in that window.'),
    ).toBeInTheDocument()
  })

  it('has three checks and final consequence copy for standard items', async () => {
    renderInspect(
      { ...AT_DOOR, listing: { ...orderResponse().listing, is_serialized: false } },
      { is_serialized: false, unique_id: null },
    )
    expect(await screen.findByText('0 of 3 checked')).toBeInTheDocument()
    expect(screen.getByText('Accepting is final and releases payment to the seller.')).toBeInTheDocument()
  })

  it("compares with the seller's photos in a full-screen viewer", async () => {
    const { user } = renderInspect(AT_DOOR, {
      photos: [
        { id: 'a', url: `/listings/${LISTING}/photos/a` },
        { id: 'b', url: `/listings/${LISTING}/photos/b` },
      ],
    })
    await user.click(await screen.findByRole('button', { name: 'Seller photo 2 of 2' }))
    expect(await screen.findByRole('img', { name: 'iPhone 13, 128GB, Midnight (2 of 2)' })).toHaveAttribute(
      'src',
      `/api/listings/${LISTING}/photos/b`,
    )
    await user.click(screen.getByRole('button', { name: 'Close photo' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('says the item is not at the door yet before arrival', async () => {
    const { user, router } = renderInspect({ status: 'out_for_delivery' })
    expect(
      await screen.findByRole('heading', { name: "Your item isn't at your door yet" }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Track my order' }))
    expect(router.state.location.pathname).toBe(`/order/${ID}`)
  })
})
