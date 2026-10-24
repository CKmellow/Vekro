import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { orderListResponse, orderResponse, orderSummaryResponse, paymentResponse } from '@/test/fixtures'
import { server } from '@/test/server'
import { ApiError } from './errors'
import {
  createOrder,
  getOrder,
  listOrders,
  resendPayment,
  toOrder,
  toOrderSummary,
  toPaymentInstruction,
} from './transactions'

const ORDER_ID = orderResponse().id

describe('payment instruction', () => {
  it('keeps an STK prompt as is', () => {
    expect(toPaymentInstruction(paymentResponse({ status: 'failed', failure_reason: 'wrong_pin' }))).toEqual({
      kind: 'STK_PROMPT',
      status: 'failed',
      failureReason: 'wrong_pin',
      sentAt: '2026-10-20T09:00:00Z',
      expiresAt: '2026-10-20T09:01:30Z',
      resendAvailableAt: '2026-10-20T09:00:30Z',
    })
  })

  it('carries the URL for a redirect', () => {
    const instruction = toPaymentInstruction(
      paymentResponse({ kind: 'REDIRECT', redirect_url: 'https://pay.example/checkout/1' }),
    )
    expect(instruction).toMatchObject({ kind: 'REDIRECT', redirectUrl: 'https://pay.example/checkout/1' })
  })

  it('treats a redirect without a URL as a prompt that failed to start', () => {
    expect(toPaymentInstruction(paymentResponse({ kind: 'REDIRECT', redirect_url: null }))).toMatchObject({
      kind: 'STK_PROMPT',
      status: 'failed_to_initiate',
    })
  })

  it('never exposes a redirect URL for an STK prompt', () => {
    expect(
      toPaymentInstruction(paymentResponse({ redirect_url: 'https://pay.example/x' })),
    ).not.toHaveProperty('redirectUrl')
  })
})

describe('order mapping', () => {
  it('maps the detail response, with amounts as numbers and the human reference', () => {
    const order = toOrder(orderResponse(), new Date('2026-10-20T09:00:00Z').getTime())
    expect(order).toMatchObject({
      reference: 'VK-7K3P9Q',
      status: 'awaiting_payment',
      amount: 52000,
      viewerRole: 'buyer',
      simulated: true,
      listing: { title: 'iPhone 13, 128GB, Midnight', price: 52000, isSerialized: true },
      buyer: { phoneMasked: '+254 712 *** 678' },
      deadlines: { dispatchBy: null, inspectBy: null },
      serverOffsetMs: 0,
      payment: { kind: 'STK_PROMPT', status: 'pending' },
    })
    expect(order.listing.policy.resolution).toBe('repair')
  })

  it('measures how far the device clock is from the server', () => {
    const fastPhone = new Date('2026-10-20T09:05:00Z').getTime()
    expect(toOrder(orderResponse(), fastPhone).serverOffsetMs).toBe(-5 * 60_000)
  })

  it('has no payment for the seller and knows real custody', () => {
    const order = toOrder(
      orderResponse({ payment: null, viewer_role: 'seller', custody_provider: 'econfirm' }),
    )
    expect(order).toMatchObject({ payment: null, viewerRole: 'seller', simulated: false })
  })
})

describe('transactions API', () => {
  it('reads one order', async () => {
    server.use(
      http.get(`/api/transactions/${ORDER_ID}`, () =>
        HttpResponse.json(
          orderResponse({ status: 'locked', deadlines: { dispatch_by: '2026-10-22T09:00:00Z' } }),
        ),
      ),
    )
    expect(await getOrder(ORDER_ID)).toMatchObject({
      status: 'locked',
      deadlines: { dispatchBy: '2026-10-22T09:00:00Z', holdUntil: null },
    })
  })

  it('creates with the listing only, never an amount', async () => {
    let body: unknown
    server.use(
      http.post('/api/transactions', async ({ request }) => {
        body = await request.json()
        const { id, reference, status } = orderResponse()
        return HttpResponse.json({ id, reference, status, payment: paymentResponse() }, { status: 201 })
      }),
    )
    const created = await createOrder('listing-1')
    expect(body).toEqual({ listing_id: 'listing-1' })
    expect(created).toMatchObject({ id: ORDER_ID, reference: 'VK-7K3P9Q', payment: { status: 'pending' } })
  })

  it('continues with the order when the prompt failed to start (202)', async () => {
    server.use(
      http.post('/api/transactions', () => {
        const { id, reference, status } = orderResponse()
        return HttpResponse.json(
          { id, reference, status, payment: paymentResponse({ status: 'failed_to_initiate' }) },
          { status: 202 },
        )
      }),
    )
    expect((await createOrder('listing-1')).payment.status).toBe('failed_to_initiate')
  })

  it('resends, and reports the cooldown as rate_limited with retryAfterSeconds', async () => {
    server.use(
      http.post(`/api/transactions/${ORDER_ID}/payment/resend`, () =>
        HttpResponse.json(
          { detail: 'Wait before sending another payment prompt.' },
          {
            status: 429,
            headers: { 'Retry-After': '12' },
          },
        ),
      ),
    )
    const error = await resendPayment(ORDER_ID).catch((e: unknown) => e)
    expect(error).toBeInstanceOf(ApiError)
    expect(error).toMatchObject({ kind: 'rate_limited', retryAfterSeconds: 12 })

    server.use(
      http.post(`/api/transactions/${ORDER_ID}/payment/resend`, () => HttpResponse.json(paymentResponse())),
    )
    expect(await resendPayment(ORDER_ID)).toMatchObject({ status: 'pending' })
  })
})

describe('order list', () => {
  it('maps a row with the counterpart, deadlines and an API-rooted cover photo', () => {
    const row = toOrderSummary(
      orderSummaryResponse({
        listing: { ...orderSummaryResponse().listing, photo_url: '/listings/l1/photos/p1' },
      }),
    )
    expect(row).toEqual({
      id: ORDER_ID,
      reference: 'VK-7K3P9Q',
      status: 'locked',
      amount: 52000,
      viewerRole: 'seller',
      listing: {
        id: orderSummaryResponse().listing.id,
        title: 'iPhone 13, 128GB, Midnight',
        isSerialized: true,
        photoUrl: '/api/listings/l1/photos/p1',
      },
      counterpart: { name: 'Brian Otieno', phoneMasked: '+254 712 *** 678' },
      deadlines: {
        dispatchBy: '2026-10-26T09:10:00Z',
        inspectBy: null,
        holdUntil: null,
        returnSendBy: null,
        returnConfirmBy: null,
      },
      createdAt: '2026-10-24T09:10:00Z',
      updatedAt: '2026-10-24T09:10:00Z',
    })
  })

  it('sends the filter as query parameters, repeating statuses and trimming the search', async () => {
    let url = new URL('http://x')
    server.use(
      http.get('/api/transactions', ({ request }) => {
        url = new URL(request.url)
        return HttpResponse.json(orderListResponse())
      }),
    )
    const list = await listOrders({
      segment: 'needs_action',
      statuses: ['locked', 'out_for_delivery'],
      q: '  VK-7K ',
      sort: 'amount_desc',
      page: 2,
      pageSize: 10,
    })
    expect(url.searchParams.getAll('status')).toEqual(['locked', 'out_for_delivery'])
    expect(Object.fromEntries([...url.searchParams].filter(([k]) => k !== 'status'))).toEqual({
      segment: 'needs_action',
      q: 'VK-7K',
      sort: 'amount_desc',
      page: '2',
      page_size: '10',
    })
    expect(list).toMatchObject({
      total: 1,
      page: 1,
      pageSize: 20,
      segmentCounts: { needs_action: 1, completed: 0 },
      statusCounts: { locked: 1 },
    })
    expect(list.items[0]?.reference).toBe('VK-7K3P9Q')
  })

  it('leaves out an empty search and unset filters', async () => {
    let search = 'unset'
    server.use(
      http.get('/api/transactions', ({ request }) => {
        search = new URL(request.url).search
        return HttpResponse.json(orderListResponse([]))
      }),
    )
    await listOrders({ q: '   ' })
    expect(search).toBe('')
  })

  it('measures the server clock offset', async () => {
    server.use(
      http.get('/api/transactions', () =>
        HttpResponse.json(
          orderListResponse([], { server_time: new Date(Date.now() + 60_000).toISOString() }),
        ),
      ),
    )
    const { serverOffsetMs } = await listOrders()
    expect(serverOffsetMs).toBeGreaterThan(55_000)
    expect(serverOffsetMs).toBeLessThan(65_000)
  })
})
