import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'
import { listingResponse, paymentResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { sampleUser, signedInAs } from '@/test/session'
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
  const router = createMemoryRouter(
    [
      { path: '/pay/:listingId', element: <PayPage /> },
      { path: '/order/:orderId/payment', element: <h1>Complete payment</h1> },
    ],
    { initialEntries: [`/pay/${ID}`] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

const ORDER = {
  id: 'order-1',
  reference: 'VK-7K3P9Q',
  status: 'awaiting_payment',
  payment: paymentResponse(),
}

function acceptOrders(posts: unknown[] = [], respond = () => HttpResponse.json(ORDER, { status: 201 })) {
  server.use(
    http.post('/api/transactions', async ({ request }) => {
      posts.push(await request.json())
      return respond()
    }),
  )
  return posts
}

beforeEach(() => signedInAs(null))

async function fillRegister(user: ReturnType<typeof renderPay>['user']) {
  await user.type(await screen.findByLabelText('M-Pesa phone number'), '712345678')
  await user.type(screen.getByLabelText('Your name'), 'Wanjiku Kamau')
  await user.type(screen.getByLabelText('Create a password'), 'Mango2026')
  await user.click(screen.getByRole('checkbox'))
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

  it('enables Pay only when the details are valid and the terms ticked', async () => {
    const { user } = renderPay()
    const pay = await screen.findByRole('button', { name: /Pay KES 52,000 with M-Pesa/ })
    expect(pay).toBeDisabled()
    await fillRegister(user)
    expect(pay).toBeEnabled()
    await user.clear(screen.getByLabelText('M-Pesa phone number'))
    await user.type(screen.getByLabelText('M-Pesa phone number'), '512')
    expect(pay).toBeDisabled()
  })

  it('saves the details as a buyer account with the M-Pesa phone, then logs in', async () => {
    const calls: { path: string; body: unknown }[] = []
    server.use(
      http.post('/api/auth/register', async ({ request }) => {
        calls.push({ path: 'register', body: await request.json() })
        return HttpResponse.json(sampleUser('buyer'), { status: 201 })
      }),
      http.post('/api/auth/login', async ({ request }) => {
        calls.push({ path: 'login', body: await request.json() })
        return HttpResponse.json(sampleUser('buyer'))
      }),
    )
    acceptOrders()
    const { user } = renderPay()
    await fillRegister(user)
    await user.click(screen.getByRole('button', { name: /Pay KES 52,000/ }))
    await waitFor(() => expect(calls).toHaveLength(2))
    expect(await screen.findByRole('heading', { name: 'Complete payment' })).toBeInTheDocument()
    expect(calls[0]?.body).toEqual({
      name: 'Wanjiku Kamau',
      phone: '+254712345678',
      password: 'Mango2026',
      role: 'buyer',
      mpesa_phone: '+254712345678',
    })
    expect(calls[1]?.body).toEqual({ phone: '+254712345678', password: 'Mango2026' })
  })

  it('switches to log in when the number already has an account', async () => {
    server.use(
      http.post('/api/auth/register', () =>
        HttpResponse.json({ detail: 'Phone already registered.' }, { status: 409 }),
      ),
    )
    const { user } = renderPay()
    await fillRegister(user)
    await user.click(screen.getByRole('button', { name: /Pay KES 52,000/ }))
    expect(await screen.findByRole('heading', { name: 'Welcome back' })).toBeInTheDocument()
    expect(screen.getByText('This number already has a Vekro account. Log in to pay.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Your name')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toHaveValue('')
  })

  it('says when the log in details are wrong', async () => {
    server.use(
      http.post('/api/auth/login', () =>
        HttpResponse.json({ detail: 'Invalid credentials.' }, { status: 401 }),
      ),
    )
    const { user } = renderPay()
    await user.click(await screen.findByRole('button', { name: 'Already have a Vekro account? Log in' }))
    await user.type(screen.getByLabelText('M-Pesa phone number'), '712345678')
    await user.type(screen.getByLabelText('Password'), 'wrong-one-1')
    await user.click(screen.getByRole('checkbox'))
    await user.click(screen.getByRole('button', { name: /Pay KES 52,000/ }))
    expect(
      await screen.findByText("Phone or password doesn't match. Check them and try again."),
    ).toBeInTheDocument()
  })

  it('shows who is paying when a buyer is signed in, and Not you? logs out', async () => {
    signedInAs('buyer')
    let loggedOut = false
    server.use(
      http.post('/api/auth/logout', () => {
        loggedOut = true
        return new HttpResponse(null, { status: 204 })
      }),
    )
    const { user } = renderPay()
    expect(await screen.findByText('+254 722 *** 904')).toBeInTheDocument()
    const pay = screen.getByRole('button', { name: /Pay KES 52,000/ })
    await user.click(screen.getByRole('checkbox'))
    expect(pay).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Not you?' }))
    await waitFor(() => expect(loggedOut).toBe(true))
    expect(await screen.findByLabelText('M-Pesa phone number')).toBeInTheDocument()
  })

  it('does not let a seller account pay', async () => {
    signedInAs('seller')
    renderPay()
    expect(await screen.findByText("This account can't pay for items")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pay KES 52,000/ })).toBeDisabled()
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

  describe('starting the payment', () => {
    beforeEach(() => signedInAs('buyer'))

    async function pressPay(user: ReturnType<typeof renderPay>['user']) {
      await user.click(await screen.findByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: /Pay KES 52,000/ }))
    }

    it('creates the transaction with the listing only and goes to B2', async () => {
      const posts = acceptOrders()
      const { user, router } = renderPay()
      await pressPay(user)
      expect(await screen.findByRole('heading', { name: 'Complete payment' })).toBeInTheDocument()
      expect(posts).toEqual([{ listing_id: ID }])
      expect(router.state.location.pathname).toBe('/order/order-1/payment')
    })

    it('continues to B2 when the prompt failed to start (202)', async () => {
      acceptOrders([], () =>
        HttpResponse.json(
          { ...ORDER, payment: paymentResponse({ status: 'failed_to_initiate' }) },
          { status: 202 },
        ),
      )
      const { user } = renderPay()
      await pressPay(user)
      expect(await screen.findByRole('heading', { name: 'Complete payment' })).toBeInTheDocument()
    })

    it('sends one request for a double press', async () => {
      let release = () => {}
      const gate = new Promise<void>((resolve) => (release = resolve))
      const posts = acceptOrders(
        [],
        () => gate.then(() => HttpResponse.json(ORDER, { status: 201 })) as never,
      )
      const { user } = renderPay()
      await user.click(await screen.findByRole('checkbox'))
      const pay = screen.getByRole('button', { name: /Pay KES 52,000/ })
      await user.click(pay)
      await user.click(pay)
      release()
      await screen.findByRole('heading', { name: 'Complete payment' })
      expect(posts).toHaveLength(1)
    })

    it('says when someone else already paid for the item', async () => {
      acceptOrders([], () =>
        HttpResponse.json({ detail: 'This item has already been paid for.' }, { status: 422 }),
      )
      const { user } = renderPay()
      await pressPay(user)
      expect(await screen.findByRole('alert')).toHaveTextContent('This item has already been paid for.')
    })

    it('says nothing was charged when the server fails', async () => {
      acceptOrders([], () => HttpResponse.json({ detail: 'down' }, { status: 503 }))
      const { user } = renderPay()
      await pressPay(user)
      expect(await screen.findByRole('alert')).toHaveTextContent(
        "We couldn't start the payment. Nothing was charged. Try again.",
      )
    })
  })
})
