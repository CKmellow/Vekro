import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { orderResponse, paymentResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { signedInAs } from '@/test/session'
import { PayReturnPage } from './PayReturnPage'

const ID = orderResponse().id
const REF = 'VK-7K3P9Q'
const TRACKING = 'b945e4af-0000-4000-8000-000000000000'
// What Pesapal sends back: our `order` and `ref`, plus its own parameters, none of them trusted.
const RETURN = `/pay/return?order=${ID}&ref=${REF}&OrderTrackingId=${TRACKING}&OrderMerchantReference=${REF}&OrderNotificationType=CALLBACKURL`
const STATUS_URL = `/api/public/orders/${REF}/card-payment`
const CARD = paymentResponse({ kind: 'REDIRECT', redirect_url: 'https://cybqa.pesapal.com/x' })

type Status = {
  state_group: 'unpaid' | 'paid' | 'closed'
  payment_status: 'pending' | 'failed' | 'succeeded'
}
const status = (s: Partial<Status> & { failure_reason?: 'declined' | null } = {}) => ({
  reference: REF,
  state_group: 'unpaid',
  payment_status: 'pending',
  failure_reason: null,
  ...s,
})

function renderReturn(url = RETURN) {
  const router = createMemoryRouter(
    [
      { path: '/pay/return', element: <PayReturnPage /> },
      { path: '/order/:orderId/payment', element: <h1>Payment received</h1> },
      { path: '/order/:orderId', element: <h1>Order tracker</h1> },
    ],
    { initialEntries: [url] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

let checks = 0
let reads = 0
let privateReads = 0
const trackingIds: string[] = []

/** The public read answers `pending` until the `paidAfter`-th read (GET or POST). */
function servePublic(paidAfter = Infinity, unpaid = status()) {
  const answer = () =>
    checks + reads >= paidAfter ? status({ state_group: 'paid', payment_status: 'succeeded' }) : unpaid
  server.use(
    http.post(STATUS_URL, ({ request }) => {
      checks += 1
      trackingIds.push(new URL(request.url).searchParams.get('tracking_id') ?? '')
      return HttpResponse.json(answer())
    }),
    http.get(STATUS_URL, () => {
      reads += 1
      return HttpResponse.json(answer())
    }),
  )
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  checks = 0
  reads = 0
  privateReads = 0
  trackingIds.length = 0
  server.use(
    http.get(`/api/transactions/${ID}`, () => {
      privateReads += 1
      return HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 })
    }),
    http.post(`/api/transactions/${ID}/payment/refresh`, () =>
      HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
    ),
  )
})
afterEach(() => vi.useRealTimers())

describe('/pay/return', () => {
  it('without a session: checks once, confirms by polling the public read, then says it is paid', async () => {
    signedInAs(null)
    servePublic(3)
    const { user, router } = renderReturn()
    expect(await screen.findByRole('status')).toHaveTextContent('Confirming your payment…')
    await act(() => vi.advanceTimersByTimeAsync(3100))
    expect(await screen.findByRole('status')).toHaveTextContent('Payment received.')
    expect(screen.getByText(/Sign in to see your order/)).toBeInTheDocument()
    expect(checks).toBe(1)
    expect(trackingIds).toEqual([TRACKING])
    expect(privateReads).toBe(0)

    await user.click(screen.getByRole('button', { name: 'See my order' }))
    expect(router.state.location.pathname).toBe(`/order/${ID}`)
  })

  it('signed in: hands over to B2 once the public read says paid', async () => {
    signedInAs('buyer')
    servePublic(3)
    const { router } = renderReturn()
    await screen.findByText('Confirming your payment…')
    await act(() => vi.advanceTimersByTimeAsync(3100))
    expect(await screen.findByRole('heading', { name: 'Payment received' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/order/${ID}/payment`)
    expect(checks).toBe(1)
  })

  it("says it hasn't received confirmation after 90 seconds, and can check again", async () => {
    signedInAs(null)
    servePublic()
    const { user, router } = renderReturn()
    await screen.findByText('Confirming your payment…')
    await act(() => vi.advanceTimersByTimeAsync(90_500))
    expect(await screen.findByText("We haven't received confirmation yet.")).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Check again' }))
    expect(await screen.findByText('Confirming your payment…')).toBeInTheDocument()
    expect(checks).toBe(2)

    await act(() => vi.advanceTimersByTimeAsync(90_500))
    await user.click(await screen.findByRole('button', { name: 'Track my order' }))
    expect(router.state.location.pathname).toBe(`/order/${ID}`)
  })

  it('offers Try again when the card was declined', async () => {
    signedInAs(null)
    servePublic(Infinity, status({ payment_status: 'failed', failure_reason: 'declined' }))
    renderReturn()
    expect(await screen.findByText("The payment didn't go through.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('cannot match a tracking id that is not this order’s', async () => {
    signedInAs(null)
    server.use(
      http.post(STATUS_URL, () => HttpResponse.json({ detail: 'Payment not found.' }, { status: 404 })),
      http.get(STATUS_URL, () => HttpResponse.json({ detail: 'Payment not found.' }, { status: 404 })),
    )
    renderReturn()
    expect(await screen.findByRole('heading', { name: "We can't match this payment" })).toBeInTheDocument()
  })

  it('cannot match a return without our order or a tracking id', async () => {
    signedInAs(null)
    servePublic()
    renderReturn('/pay/return?OrderNotificationType=CALLBACKURL')
    expect(await screen.findByRole('heading', { name: "We can't match this payment" })).toBeInTheDocument()
    expect(checks).toBe(0)
  })

  describe('an old return URL without the tracking id', () => {
    const OLD = `/pay/return?order=${ID}&ref=${REF}`

    it('uses the signed-in read', async () => {
      signedInAs('buyer')
      let n = 0
      server.use(
        http.post(`/api/transactions/${ID}/payment/refresh`, () => HttpResponse.json(CARD)),
        http.get(`/api/transactions/${ID}`, () => {
          n += 1
          return HttpResponse.json(
            orderResponse({ payment: CARD, status: n >= 2 ? 'locked' : 'awaiting_payment' }),
          )
        }),
      )
      const { router } = renderReturn(OLD)
      await act(() => vi.advanceTimersByTimeAsync(3100))
      expect(await screen.findByRole('heading', { name: 'Payment received' })).toBeInTheDocument()
      expect(router.state.location.pathname).toBe(`/order/${ID}/payment`)
    })

    it('asks to sign in instead of spinning when there is no session', async () => {
      signedInAs(null)
      renderReturn(OLD)
      expect(await screen.findByRole('status')).toHaveTextContent('Sign in to see your payment.')
      expect(screen.getByRole('button', { name: 'See my order' })).toBeInTheDocument()
    })
  })
})
