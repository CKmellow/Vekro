import { act, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { orderResponse, paymentResponse } from '@/test/fixtures'
import { renderWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { PaymentPage } from './PaymentPage'

const ID = orderResponse().id
const NOW = new Date('2026-10-20T09:00:10Z')
/** Server time a minute after the prompt: its resend cooldown has passed. */
const LATER = '2026-10-20T09:01:10Z'

function serve(...responses: Parameters<typeof orderResponse>[0][]) {
  let i = 0
  server.use(
    http.get(`/api/transactions/${ID}`, () =>
      HttpResponse.json(orderResponse(responses[Math.min(i++, responses.length - 1)])),
    ),
  )
}

function renderPayment() {
  const router = createMemoryRouter(
    [
      { path: '/order/:orderId/payment', element: <PaymentPage /> },
      { path: '/order/:orderId', element: <h1>Order tracker</h1> },
      { path: '/pay/:listingId', element: <h1>Order summary</h1> },
    ],
    { initialEntries: [`/order/${ID}/payment`] },
  )
  return { router, ...renderWithProviders(<RouterProvider router={router} />) }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true, now: NOW })
  act(() => toast.current().forEach((t) => toast.dismiss(t.id)))
})
afterEach(() => vi.useRealTimers())

describe('B2 payment', () => {
  it('asks the buyer to approve on their phone, with the countdown and a locked resend', async () => {
    serve({ server_time: NOW.toISOString() })
    renderPayment()
    expect(
      await screen.findByRole('heading', { name: 'Check your phone and enter your M-Pesa PIN' }),
    ).toBeInTheDocument()
    expect(screen.getByText('+254 712 *** 678')).toBeInTheDocument()
    expect(screen.getByText('Waiting for payment')).toBeInTheDocument()
    expect(screen.getByText("Test payment via Vekro's simulator: no real money moves.")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Resend prompt (0:20)' })).toBeDisabled()
  })

  it('shows success only once polling sees the transaction locked', async () => {
    serve({ server_time: NOW.toISOString() }, { status: 'locked', server_time: NOW.toISOString() })
    const { user, router } = renderPayment()
    await screen.findByText('Check your phone and enter your M-Pesa PIN')
    await act(() => vi.advanceTimersByTimeAsync(3100))
    expect(await screen.findByRole('heading', { name: 'Payment received' })).toHaveFocus()
    expect(screen.getByText('Paid, funds held safely')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Track my order' }))
    expect(router.state.location.pathname).toBe(`/order/${ID}`)
  })

  it.each([
    ['cancelled', 'You cancelled the M-Pesa request.'],
    ['wrong_pin', 'The PIN was incorrect.'],
    ['insufficient_funds', "There wasn't enough in M-Pesa."],
    ['provider_error', "M-Pesa didn't go through."],
  ] as const)('explains a %s failure and offers Try again', async (reason, title) => {
    serve({ server_time: LATER, payment: paymentResponse({ status: 'failed', failure_reason: reason }) })
    renderPayment()
    expect(await screen.findByText(title)).toBeInTheDocument()
    expect(screen.getByText("Payment didn't go through")).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
  })

  it('sends a new request when the prompt expired', async () => {
    let resent = 0
    serve(
      { server_time: LATER, payment: paymentResponse({ status: 'expired' }) },
      { server_time: NOW.toISOString() },
    )
    server.use(
      http.post(`/api/transactions/${ID}/payment/resend`, () => {
        resent += 1
        return HttpResponse.json(paymentResponse())
      }),
    )
    const { user } = renderPayment()
    expect(await screen.findByText('The M-Pesa request expired.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send a new request' }))
    expect(await screen.findByText('Check your phone and enter your M-Pesa PIN')).toBeInTheDocument()
    expect(resent).toBe(1)
  })

  it('waits out the cooldown before Try again, including a server 429', async () => {
    // Cancelled 10s after the prompt: the resend cooldown is still running.
    serve({
      server_time: NOW.toISOString(),
      payment: paymentResponse({ status: 'failed', failure_reason: 'cancelled' }),
    })
    renderPayment()
    expect(await screen.findByRole('button', { name: 'Try again (0:20)' })).toBeDisabled()

    server.use(
      http.post(`/api/transactions/${ID}/payment/resend`, () =>
        HttpResponse.json({ detail: 'Wait.' }, { status: 429, headers: { 'Retry-After': '12' } }),
      ),
    )
    await act(() => vi.advanceTimersByTimeAsync(21_000))
    const tryAgain = screen.getByRole('button', { name: 'Try again' })
    expect(tryAgain).toBeEnabled()
    await act(async () => tryAgain.click())
    expect(await screen.findByRole('button', { name: /^Try again \(0:1[12]\)$/ })).toBeDisabled()
  })

  it('asks before leaving, starting on Stay', async () => {
    serve({ server_time: NOW.toISOString() })
    const { user, router } = renderPayment()
    await user.click(await screen.findByRole('button', { name: 'Leave payment' }))
    expect(await screen.findByRole('alertdialog', { name: 'Leave payment?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Stay' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Leave' }))
    expect(router.state.location.pathname).toBe(`/pay/${orderResponse().listing.id}`)
  })

  it('says when the payment does not exist for this buyer', async () => {
    server.use(http.get(`/api/transactions/${ID}`, () => HttpResponse.json({ detail: 'x' }, { status: 404 })))
    renderPayment()
    expect(await screen.findByRole('heading', { name: "We can't find this payment" })).toBeInTheDocument()
  })

  it('sends a hosted-checkout buyer to the secure page', async () => {
    serve({
      server_time: NOW.toISOString(),
      payment: paymentResponse({ kind: 'REDIRECT', redirect_url: 'https://pay.example/checkout/1' }),
    })
    renderPayment()
    expect(
      await screen.findByRole('heading', { name: 'Continue to secure card checkout' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Continue to secure card checkout' })).toHaveAttribute(
      'href',
      'https://pay.example/checkout/1',
    )
    expect(screen.queryByRole('button', { name: /Resend/ })).not.toBeInTheDocument()
  })

  describe('pay by card instead (#290)', () => {
    const CHECKOUT = paymentResponse({
      kind: 'REDIRECT',
      redirect_url: 'https://cybqa.pesapal.com/checkout/2',
      expires_at: '2026-10-20T09:30:10Z',
    })

    it('is not offered while the M-Pesa prompt is open on the phone', async () => {
      serve({ server_time: NOW.toISOString() })
      renderPayment()
      await screen.findByText('Check your phone and enter your M-Pesa PIN')
      expect(screen.queryByRole('button', { name: 'Pay by card instead' })).not.toBeInTheDocument()
      expect(screen.getByText('Your money goes into the Vekro vault, not to the seller.')).toBeInTheDocument()
    })

    it('switches a failed M-Pesa order to the card checkout, held by Pesapal', async () => {
      let switched = 0
      serve(
        { server_time: LATER, payment: paymentResponse({ status: 'failed', failure_reason: 'cancelled' }) },
        { server_time: LATER, payment_method: 'card', collection_rail: 'pesapal', payment: CHECKOUT },
      )
      server.use(
        http.post(`/api/transactions/${ID}/payment/card`, () => {
          switched += 1
          return HttpResponse.json(CHECKOUT)
        }),
      )
      const { user } = renderPayment()
      await screen.findByText('You cancelled the M-Pesa request.')
      await user.click(screen.getByRole('button', { name: 'Pay by card instead' }))
      expect(await screen.findByRole('link', { name: 'Continue to secure card checkout' })).toHaveAttribute(
        'href',
        'https://cybqa.pesapal.com/checkout/2',
      )
      expect(switched).toBe(1)
      expect(
        screen.getByText('Your card payment will be held by Pesapal, not paid to the seller.'),
      ).toBeInTheDocument()
      expect(screen.queryByText(/Vekro vault/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Pay by card instead' })).not.toBeInTheDocument()
    })

    it('says the M-Pesa request is still open when the server refuses with Retry-After', async () => {
      serve({ server_time: LATER, payment: paymentResponse({ status: 'expired' }) })
      server.use(
        http.post(`/api/transactions/${ID}/payment/card`, () =>
          HttpResponse.json(
            { detail: 'Your M-Pesa prompt is still open.' },
            { status: 409, headers: { 'Retry-After': '30' } },
          ),
        ),
      )
      const { user } = renderPayment()
      await user.click(await screen.findByRole('button', { name: 'Pay by card instead' }))
      await vi.waitFor(() =>
        expect(toast.current().map((t) => t.message)).toContain(
          'Your M-Pesa request is still open. Finish or cancel it on your phone, then try again.',
        ),
      )
    })

    it('explains when card payments are off', async () => {
      serve({ server_time: LATER, payment: paymentResponse({ status: 'failed_to_initiate' }) })
      server.use(
        http.post(`/api/transactions/${ID}/payment/card`, () =>
          HttpResponse.json({ detail: 'Card payments are not available right now.' }, { status: 503 }),
        ),
      )
      const { user } = renderPayment()
      await user.click(await screen.findByRole('button', { name: 'Pay by card instead' }))
      await vi.waitFor(() =>
        expect(toast.current().map((t) => t.message)).toContain('Card payments are not available right now.'),
      )
    })

    it('names Pesapal on the money path once a card order is paid', async () => {
      serve({
        status: 'locked',
        server_time: LATER,
        payment_method: 'card',
        collection_rail: 'pesapal',
        payment: CHECKOUT,
      })
      renderPayment()
      expect(await screen.findByRole('heading', { name: 'Payment received' })).toBeInTheDocument()
      expect(screen.getByText('Held by Pesapal')).toBeInTheDocument()
      expect(screen.queryByText(/Vekro vault/)).not.toBeInTheDocument()
    })

    it('speaks card when the switched checkout failed to start', async () => {
      serve({
        server_time: LATER,
        payment_method: 'card',
        collection_rail: 'pesapal',
        payment: paymentResponse({ kind: 'REDIRECT', status: 'failed_to_initiate', redirect_url: null }),
      })
      renderPayment()
      expect(await screen.findByText("We couldn't start the card checkout.")).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Try again' })).toBeEnabled()
      expect(screen.queryByText(/M-Pesa/)).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Change phone number' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Pay by card instead' })).not.toBeInTheDocument()
    })
  })
})
