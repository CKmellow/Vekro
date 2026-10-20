import { useQuery } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { renderHookWithProviders, renderWithProviders } from './render'
import { server, takeUnhandled } from './server'

describe('test harness', () => {
  it('renders a view with the providers', () => {
    renderWithProviders(<h1>Vekro</h1>)
    expect(screen.getByRole('heading', { name: 'Vekro' })).toBeInTheDocument()
  })

  it('serves MSW handlers to query hooks', async () => {
    server.use(http.get('/health', () => HttpResponse.json({ status: 'ok' })))
    const { result } = renderHookWithProviders(() =>
      useQuery({
        queryKey: ['health'],
        queryFn: async () =>
          (await fetch(new URL('/health', window.location.origin))).json() as Promise<{ status: string }>,
      }),
    )
    await waitFor(() => expect(result.current.isSuccess).toBe(true))
    expect(result.current.data).toEqual({ status: 'ok' })
  })

  it('fails on unhandled requests', async () => {
    // MSW answers the blocked request with a 500 instead of passing it to the network.
    const response = await fetch(new URL('/not-mocked', window.location.origin))
    expect(response.status).toBe(500)
    expect(takeUnhandled()).toEqual(['GET /not-mocked'])
  })
})
