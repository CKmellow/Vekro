import { act, renderHook, waitFor } from '@testing-library/react'
import { QueryClientProvider, useQuery } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from '@/models/api/errors'
import { createTestQueryClient } from '@/test/render'
import { server } from '@/test/server'
import {
  sessionKeys,
  useCurrentUser,
  useRegister,
  useSessionExpired,
  useSignIn,
  useSignOut,
  watchSessionExpiry,
} from './session'

const amina = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Amina Wanjiru',
  phone: '+254722118904',
  role: 'seller' as const,
  mpesa_phone: '+254722118904',
  mpesa_account_name: null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
}

function setup() {
  const client = createTestQueryClient()
  watchSessionExpiry(client)
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  )
  return { client, wrapper }
}

const bodies: unknown[] = []
beforeEach(() => {
  bodies.length = 0
  localStorage.clear()
  sessionStorage.clear()
  server.use(
    http.post('/api/auth/login', async ({ request }) => {
      const body = (await request.json()) as { password: string }
      bodies.push({ login: body })
      return body.password === 'right-pass-1'
        ? HttpResponse.json(amina)
        : HttpResponse.json({ detail: 'Invalid phone or password.' }, { status: 401 })
    }),
    http.post('/api/auth/register', async ({ request }) => {
      bodies.push({ register: await request.json() })
      return HttpResponse.json(amina, { status: 201 })
    }),
    http.post('/api/auth/logout', () => new HttpResponse(null, { status: 204 })),
  )
})

describe('session', () => {
  it('signs in, caches the user and stores nothing in the browser', async () => {
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useSignIn(), { wrapper })
    await act(() => result.current.mutateAsync({ phone: '+254722118904', password: 'right-pass-1' }))
    expect(client.getQueryData(sessionKeys.me)).toEqual(amina)
    expect(localStorage.length + sessionStorage.length).toBe(0)
  })

  it('treats a wrong password as a failed log in, not an expired session', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(sessionKeys.me, amina)
    const { result } = renderHook(() => useSignIn(), { wrapper })
    await act(async () => {
      await result.current.mutateAsync({ phone: '+254722118904', password: 'nope' }).catch(() => {})
    })
    expect(result.current.error).toBeInstanceOf(ApiError)
    expect(client.getQueryData(sessionKeys.me)).toEqual(amina)
  })

  it('registers and then logs in, because registering does not start a session', async () => {
    const { client, wrapper } = setup()
    const { result } = renderHook(() => useRegister(), { wrapper })
    await act(() =>
      result.current.mutateAsync({
        name: 'Amina Wanjiru',
        phone: '+254722118904',
        password: 'right-pass-1',
        role: 'seller',
      }),
    )
    expect(bodies.map((b) => Object.keys(b as object)[0])).toEqual(['register', 'login'])
    expect(client.getQueryData(sessionKeys.me)).toEqual(amina)
  })

  it('marks the session expired when a signed-in request gets a 401', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(sessionKeys.me, amina)
    server.use(
      http.get('/api/listings/x', () =>
        HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
      ),
    )
    const { result } = renderHook(
      () => ({
        expired: useSessionExpired(),
        listing: useQuery({
          queryKey: ['listing', 'x'],
          queryFn: async () => {
            const { api } = await import('@/models/api/client')
            return api.get('/listings/{listing_id}', { path: { listing_id: 'x' } })
          },
        }),
      }),
      { wrapper },
    )
    await waitFor(() => expect(result.current.expired).toBe(true))
    expect(client.getQueryData(sessionKeys.me)).toBeNull()
  })

  it('does not call a first visit without a session "expired"', async () => {
    server.use(
      http.get('/api/auth/me', () =>
        HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
      ),
    )
    const { wrapper } = setup()
    const { result } = renderHook(() => ({ me: useCurrentUser(), expired: useSessionExpired() }), { wrapper })
    await waitFor(() => expect(result.current.me.isSuccess).toBe(true))
    expect(result.current.me.data).toBeNull()
    expect(result.current.expired).toBe(false)
  })

  it('signs out and forgets cached data', async () => {
    const { client, wrapper } = setup()
    client.setQueryData(sessionKeys.me, amina)
    client.setQueryData(['listing', 'x'], { title: 'iPhone 13' })
    const { result } = renderHook(() => useSignOut(), { wrapper })
    await act(() => result.current.mutateAsync())
    expect(client.getQueryData(sessionKeys.me)).toBeNull()
    expect(client.getQueryData(['listing', 'x'])).toBeUndefined()
  })
})
