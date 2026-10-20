import { describe, expect, it } from 'vitest'
import { toOrder } from '@/models/api/transactions'
import { orderResponse, paymentResponse } from '@/test/fixtures'
import { paymentVariant, pollInterval } from './usePaymentPage'

const SENT = new Date('2026-10-20T09:00:00Z').getTime()
const order = (overrides: Parameters<typeof orderResponse>[0] = {}) => toOrder(orderResponse(overrides), SENT)

describe('B2 variant', () => {
  it('waits while the prompt is open, then times out at expiry', () => {
    expect(paymentVariant(order(), SENT + 10_000)).toMatchObject({
      kind: 'waiting',
      expiresAt: '2026-10-20T09:01:30Z',
    })
    expect(paymentVariant(order(), SENT + 90_000)).toEqual({ kind: 'timed_out' })
    expect(paymentVariant(order({ payment: paymentResponse({ status: 'expired' }) }), SENT)).toEqual({
      kind: 'timed_out',
    })
  })

  it('names the failure, defaulting to a provider error', () => {
    const failed = (reason: 'wrong_pin' | null) =>
      paymentVariant(order({ payment: paymentResponse({ status: 'failed', failure_reason: reason }) }), SENT)
    expect(failed('wrong_pin')).toEqual({ kind: 'failed', reason: 'wrong_pin' })
    expect(failed(null)).toEqual({ kind: 'failed', reason: 'provider_error' })
  })

  it('succeeds only on the transaction status, never on the prompt', () => {
    expect(paymentVariant(order({ payment: paymentResponse({ status: 'succeeded' }) }), SENT).kind).toBe(
      'waiting',
    )
    expect(paymentVariant(order({ status: 'locked' }), SENT)).toEqual({ kind: 'success' })
  })

  it('handles a prompt that never started and a hosted checkout', () => {
    expect(
      paymentVariant(order({ payment: paymentResponse({ status: 'failed_to_initiate' }) }), SENT),
    ).toEqual({
      kind: 'not_started',
    })
    const redirect = order({
      payment: paymentResponse({ kind: 'REDIRECT', redirect_url: 'https://pay.example/1' }),
    })
    expect(paymentVariant(redirect, SENT)).toEqual({ kind: 'redirect', url: 'https://pay.example/1' })
  })
})

describe('B2 polling', () => {
  it('polls every 3s within the window and grace, then stops', () => {
    expect(pollInterval(undefined)).toBe(3000)
    expect(pollInterval(order(), SENT + 60_000)).toBe(3000)
    expect(pollInterval(order(), SENT + 95_000)).toBe(3000)
    expect(pollInterval(order(), SENT + 101_000)).toBe(false)
  })

  it('stops once paid or failed', () => {
    expect(pollInterval(order({ status: 'locked' }), SENT)).toBe(false)
    expect(pollInterval(order({ payment: paymentResponse({ status: 'failed' }) }), SENT)).toBe(false)
  })

  it('uses server time, not a wrong phone clock', () => {
    // The phone is 5 minutes fast; the server says the prompt is still open.
    const fast = toOrder(orderResponse(), SENT + 300_000)
    expect(pollInterval(fast, SENT + 300_000 + 30_000)).toBe(3000)
  })
})
