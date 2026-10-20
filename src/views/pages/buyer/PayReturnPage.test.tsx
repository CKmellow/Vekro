import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { orderResponse, paymentResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { PayReturnPage } from './PayReturnPage'

const ID = orderResponse().id
const RETURN = `/pay/return?OrderTrackingId=b945e4af-80a5-4ec1-8706-e03f8332fb04&OrderMerchantReference=${ID}`

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

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }))
afterEach(() => vi.useRealTimers())

describe('/pay/return', () => {
  it('confirms by polling, never from the redirect, then hands over to B2', async () => {
    let reads = 0
    server.use(
      http.get(`/api/transactions/${ID}`, () => {
        reads += 1
        return HttpResponse.json(orderResponse({ status: reads >= 2 ? 'locked' : 'awaiting_payment' }))
      }),
    )
    const { router } = renderReturn()
    expect(await screen.findByRole('status')).toHaveTextContent('Confirming your payment…')
    expect(screen.queryByText('Payment received')).not.toBeInTheDocument()
    await act(() => vi.advanceTimersByTimeAsync(3100))
    expect(await screen.findByRole('heading', { name: 'Payment received' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/order/${ID}/payment`)
  })

  it('says it is taking longer after 90 seconds and offers the tracker', async () => {
    server.use(http.get(`/api/transactions/${ID}`, () => HttpResponse.json(orderResponse())))
    const { user, router } = renderReturn()
    await screen.findByText('Confirming your payment…')
    await act(() => vi.advanceTimersByTimeAsync(90_500))
    expect(await screen.findByText('This is taking longer than usual.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Track my order' }))
    expect(router.state.location.pathname).toBe(`/order/${ID}`)
  })

  it('offers Try again when the checkout failed', async () => {
    server.use(
      http.get(`/api/transactions/${ID}`, () =>
        HttpResponse.json(orderResponse({ payment: paymentResponse({ status: 'failed' }) })),
      ),
    )
    renderReturn()
    expect(await screen.findByText("The payment didn't go through.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it('cannot match a return without our reference', async () => {
    renderReturn('/pay/return?OrderTrackingId=x')
    expect(await screen.findByRole('heading', { name: "We can't match this payment" })).toBeInTheDocument()
  })
})
