import { screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { waitFor } from '@testing-library/react'
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

  describe('accepting with the delivery code', () => {
    function withCode(response: () => Response) {
      const sent: unknown[] = []
      let status: string = AT_DOOR.status
      server.use(
        http.get(`/api/transactions/${ID}`, () =>
          HttpResponse.json(orderResponse({ payment: null, ...AT_DOOR, status: status as never })),
        ),
        http.get(`/api/listings/${LISTING}`, () => HttpResponse.json(listingResponse())),
        http.post(`/api/transactions/${ID}/otp-give`, async ({ request }) => {
          sent.push(await request.json())
          const result = response()
          if (result.status === 200) status = 'hold_24h'
          return result
        }),
      )
      return sent
    }

    it('enables Accept at six digits, confirms the consequence, sends the code and shows the 24-hour hold', async () => {
      const { user } = renderInspect(AT_DOOR)
      const sent = withCode(() => HttpResponse.json(orderResponse({ status: 'hold_24h' })))
      const accept = await screen.findByRole('button', { name: 'Accept item' })
      expect(accept).toBeDisabled()
      await user.click(screen.getByRole('textbox', { name: /digit 1/i }))
      await user.keyboard('482913')
      expect(accept).toBeEnabled()
      await user.click(accept)
      expect(await screen.findByRole('alertdialog', { name: 'Accept this item?' })).toHaveTextContent(
        'KES 52,000 stays held for 24 hours while you test the item. After that it goes to Amina Gadgets.',
      )
      expect(screen.getByRole('button', { name: 'Not yet' })).toHaveFocus()
      await user.click(screen.getByRole('button', { name: 'Yes, accept' }))
      await waitFor(() => expect(sent).toEqual([{ otp_code: '482913' }]))
      expect(
        await screen.findByRole('heading', { name: 'Held for 24 hours. Test your item.' }),
      ).toBeInTheDocument()
      expect(screen.getByText("Won't power on")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Report a problem' })).toBeInTheDocument()
    })

    it('clears the cells and says so when the code is wrong', async () => {
      const { user } = renderInspect(AT_DOOR)
      withCode(() => HttpResponse.json({ detail: 'Invalid OTP provided.' }, { status: 422 }))
      await user.click(await screen.findByRole('textbox', { name: /digit 1/i }))
      await user.keyboard('111111')
      await user.click(screen.getByRole('button', { name: 'Accept item' }))
      await user.click(await screen.findByRole('button', { name: 'Yes, accept' }))
      expect(
        await screen.findByText("That code doesn't match. Check the SMS and try again."),
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Accept item' })).toBeDisabled()
    })
  })

  it('shows the release for an accepted standard item', async () => {
    renderInspect({ status: 'released', listing: { ...orderResponse().listing, is_serialized: false } })
    expect(await screen.findByRole('heading', { name: 'All done' })).toBeInTheDocument()
    expect(screen.getByText('You accepted the item. Amina Gadgets has been paid.')).toBeInTheDocument()
  })

  it("rejects with the seller's declared reasons and a note, then shows the refund", async () => {
    const STANDARD = {
      ...AT_DOOR,
      listing: {
        ...orderResponse().listing,
        is_serialized: false,
        dispute_policy: { door_reject_reasons: ['damaged', 'wrong_item'] },
      },
    }
    const { user } = renderInspect(STANDARD, { is_serialized: false, unique_id: null })
    let status: string = AT_DOOR.status
    let sent: unknown
    server.use(
      http.get(`/api/transactions/${ID}`, () =>
        HttpResponse.json(
          orderResponse({
            payment: null,
            ...STANDARD,
            status: status as never,
            door_rejection: status === 'refunded_buyer' ? { reason: 'wrong_item', note: 'Size 40' } : null,
          }),
        ),
      ),
      http.post(`/api/transactions/${ID}/otp-withhold`, async ({ request }) => {
        sent = await request.json()
        status = 'refunded_buyer'
        return HttpResponse.json(orderResponse({ status: 'refunded_buyer' }))
      }),
    )
    await user.click(await screen.findByRole('button', { name: "Item isn't right, reject" }))
    const sheet = await screen.findByRole('dialog', { name: "What's wrong?" })
    expect(sheet).toHaveTextContent('Damaged')
    expect(sheet).toHaveTextContent('Wrong item')
    expect(sheet).not.toHaveTextContent('Not as described')
    expect(screen.getByRole('button', { name: 'Confirm rejection' })).toBeDisabled()
    await user.click(screen.getByRole('radio', { name: /Wrong item/ }))
    await user.type(screen.getByLabelText("Tell the seller what's wrong (optional)"), 'Size 40')
    await user.click(screen.getByRole('button', { name: 'Confirm rejection' }))
    expect(
      await screen.findByRole('heading', { name: 'The item is going back to the seller' }),
    ).toBeInTheDocument()
    expect(sent).toEqual({ reason: 'wrong_item', note: 'Size 40' })
    expect(
      screen.getByText('Your refund of KES 52,000 is on its way to +254 712 *** 678.'),
    ).toBeInTheDocument()
  })

  it('offers the standard reasons when the seller declared none', async () => {
    const { user } = renderInspect(AT_DOOR)
    await user.click(await screen.findByRole('button', { name: "Item isn't right, reject" }))
    const sheet = await screen.findByRole('dialog', { name: "What's wrong?" })
    for (const reason of ['Damaged', 'Wrong item', 'Not as described', 'Missing parts', 'Something else'])
      expect(sheet).toHaveTextContent(reason)
  })

  it('says time ran out when the inspection window closed with no decision', async () => {
    renderInspect({ status: 'refunded_buyer', door_rejection: null })
    expect(await screen.findByRole('heading', { name: 'Time ran out' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Track my order' })).toBeInTheDocument()
  })
})
