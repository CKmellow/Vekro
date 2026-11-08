import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { orderResponse, paymentResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { PayReturnPage } from './PayReturnPage'

const ID = orderResponse().id
// What Pesapal sends back: our `order` and `ref`, plus its own parameters, none of them trusted.
const RETURN = `/pay/return?order=${ID}&ref=VK-7K3P9Q&OrderTrackingId=b945e4af&OrderMerchantReference=VK-7K3P9Q&OrderNotificationType=CALLBACKURL`
const CARD = paymentResponse({ kind: 'REDIRECT', redirect_url: 'https://cybqa.pesapal.com/x' })

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

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  checks = 0
  server.use(
    http.post(`/api/transactions/${ID}/payment/refresh`, () => {
      checks += 1
      return HttpResponse.json(CARD)
    }),
  )
})
afterEach(() => vi.useRealTimers())

describe('/pay/return', () => {
  it('asks the backend to check once, confirms only by polling, then hands over to B2', async () => {
    let reads = 0
    server.use(
      http.get(`/api/transactions/${ID}`, () => {
        reads += 1
        return HttpResponse.json(
          orderResponse({ payment: CARD, status: reads >= 2 ? 'locked' : 'awaiting_payment' }),
        )
      }),
    )
    const { router } = renderReturn()
    expect(await screen.findByRole('status')).toHaveTextContent('Confirming your payment…')
    expect(screen.queryByText('Payment received')).not.toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(3100))
    expect(await screen.findByRole('heading', { name: 'Payment received' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/order/${ID}/payment`)
    expect(checks).toBe(1)
  })

  it("says it hasn't received confirmation after 90 seconds, and can check again", async () => {
    server.use(http.get(`/api/transactions/${ID}`, () => HttpResponse.json(orderResponse({ payment: CARD }))))
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

  it('offers Try again when the checkout failed', async () => {
    const declined = { ...CARD, status: 'failed' as const, failure_reason: 'declined' as const }
    server.use(
      // The check answers the order's current prompt, which is the declined one.
      http.post(`/api/transactions/${ID}/payment/refresh`, () => HttpResponse.json(declined)),
      http.get(`/api/transactions/${ID}`, () => HttpResponse.json(orderResponse({ payment: declined }))),
    )
    renderReturn()
    expect(await screen.findByText("The payment didn't go through.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('cannot match a return without our order', async () => {
    renderReturn('/pay/return?OrderTrackingId=x&OrderMerchantReference=VK-7K3P9Q')
    expect(await screen.findByRole('heading', { name: "We can't match this payment" })).toBeInTheDocument()
    expect(checks).toBe(0)
  })
})
