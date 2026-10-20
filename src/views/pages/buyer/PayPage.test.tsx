import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'
import { listingResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { PayPage } from './PayPage'

const ID = listingResponse().id

function renderPay(listing: Parameters<typeof listingResponse>[0] | 'missing' = {}) {
  server.use(
    http.get(`/api/listings/${ID}`, () =>
      listing === 'missing'
        ? HttpResponse.json({ detail: 'Listing not found.' }, { status: 404 })
        : HttpResponse.json(listingResponse(listing)),
    ),
  )
  const router = createMemoryRouter([{ path: '/pay/:listingId', element: <PayPage /> }], {
    initialEntries: [`/pay/${ID}`],
  })
  return renderWithProviders(<RouterProvider router={router} />)
}

describe('B1 order summary and pay', () => {
  it('shows a serial-numbered item, its seller and the 24-hour promise', async () => {
    renderPay({
      photos: [
        { id: 'p1', url: `/listings/${ID}/photos/p1` },
        { id: 'p2', url: `/listings/${ID}/photos/p2` },
      ],
    })
    expect(
      await screen.findByRole('heading', { level: 1, name: 'iPhone 13, 128GB, Midnight' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Serial-numbered')).toBeInTheDocument()
    expect(screen.getByText('12 sales · On Vekro since Jan 2026')).toBeInTheDocument()
    expect(screen.getByText('Seller offers: Repair · Refund')).toBeInTheDocument()
    expect(screen.getByText('You have 24 hours after delivery to report a problem.')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'iPhone 13, 128GB, Midnight' })).toHaveAttribute(
      'src',
      `/api/listings/${ID}/photos/p1`,
    )
    expect(screen.getByRole('button', { name: 'Photo 2 of 2' })).toBeInTheDocument()
  })

  it('shows a standard item with its door-rejection reasons', async () => {
    renderPay({
      title: 'Nike Air Force 1, size 42',
      price: '6500.00',
      is_serialized: false,
      dispute_policy: { door_reject_reasons: ['damaged', 'wrong_item'] },
      seller: { name: 'Amina Gadgets', member_since: '2026-01-05T00:00:00Z', completed_sales: 0 },
    })
    expect(await screen.findByText('Inspect at your door')).toBeInTheDocument()
    expect(screen.getByText('Reject at the door for: Damaged, Wrong item.')).toBeInTheDocument()
    expect(screen.getByText('On Vekro since Jan 2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pay KES 6,500 with M-Pesa/ })).toBeDisabled()
  })

  it('enables Pay only with a valid phone and the terms ticked', async () => {
    const { user } = renderPay()
    const pay = await screen.findByRole('button', { name: /Pay KES 52,000 with M-Pesa/ })
    expect(pay).toBeDisabled()
    await user.type(screen.getByLabelText('M-Pesa phone number'), '712345678')
    expect(pay).toBeDisabled()
    await user.click(screen.getByRole('checkbox'))
    expect(pay).toBeEnabled()
    await user.clear(screen.getByLabelText('M-Pesa phone number'))
    await user.type(screen.getByLabelText('M-Pesa phone number'), '512')
    expect(pay).toBeDisabled()
  })

  it('expands the steps and the description, and opens the terms', async () => {
    const { user } = renderPay({ description: 'Battery health 91%. '.repeat(12) })
    await user.click(await screen.findByRole('button', { name: /See how it works/ }))
    expect(screen.getByText('Enter your code to release payment')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Read more' }))
    expect(screen.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true')
    await user.click(screen.getByRole('button', { name: 'Terms' }))
    expect(await screen.findByRole('dialog', { name: 'Terms' })).toBeInTheDocument()
  })

  it('says when the link points nowhere', async () => {
    renderPay('missing')
    expect(await screen.findByRole('heading', { name: "We can't find this item" })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Pay/ })).not.toBeInTheDocument()
  })

  it('offers a retry when the item fails to load', async () => {
    server.use(http.get(`/api/listings/${ID}`, () => HttpResponse.json({}, { status: 500 })))
    const router = createMemoryRouter([{ path: '/pay/:listingId', element: <PayPage /> }], {
      initialEntries: [`/pay/${ID}`],
    })
    const { user } = renderWithProviders(<RouterProvider router={router} />)
    expect(await screen.findByText("We couldn't load this item")).toBeInTheDocument()
    server.use(http.get(`/api/listings/${ID}`, () => HttpResponse.json(listingResponse())))
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
  })
})
