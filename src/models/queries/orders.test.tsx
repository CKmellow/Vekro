import { waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { orderResponse, paymentResponse } from '@/test/fixtures'
import { renderHookWithProviders } from '@/test/render'
import { server } from '@/test/server'
import { orderKeys, useOrder, useResendPayment } from './orders'

const ID = orderResponse().id

describe('order queries', () => {
  it('polls until the interval function says stop', async () => {
    let reads = 0
    server.use(
      http.get(`/api/transactions/${ID}`, () => {
        reads += 1
        return HttpResponse.json(orderResponse({ status: reads >= 2 ? 'locked' : 'awaiting_payment' }))
      }),
    )
    const { result } = renderHookWithProviders(() =>
      useOrder(ID, { refetchInterval: (order) => (order?.status === 'locked' ? false : 20) }),
    )
    await waitFor(() => expect(result.current.data?.status).toBe('locked'))
    const settled = reads
    await new Promise((resolve) => setTimeout(resolve, 80))
    expect(reads).toBe(settled)
  })

  it('puts a resent prompt into the cached order', async () => {
    server.use(
      http.get(`/api/transactions/${ID}`, () =>
        HttpResponse.json(
          orderResponse({ payment: paymentResponse({ status: 'failed', failure_reason: 'cancelled' }) }),
        ),
      ),
      http.post(`/api/transactions/${ID}/payment/resend`, () =>
        HttpResponse.json(paymentResponse({ sent_at: '2026-10-20T09:02:00Z' })),
      ),
    )
    const { result, client } = renderHookWithProviders(() => ({
      order: useOrder(ID),
      resend: useResendPayment(ID),
    }))
    await waitFor(() => expect(result.current.order.data?.payment?.status).toBe('failed'))
    await result.current.resend.mutateAsync()
    expect(
      client.getQueryData<{ payment: { status: string; sentAt: string } }>(orderKeys.detail(ID))?.payment,
    ).toMatchObject({
      status: 'pending',
      sentAt: '2026-10-20T09:02:00Z',
    })
  })
})
