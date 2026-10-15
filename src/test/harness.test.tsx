import { useQuery } from '@tanstack/react-query'
import { screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { App } from '@/App'
import { renderHookWithProviders, renderWithProviders } from './render'
import { server } from './server'

describe('test harness', () => {
  it('renders a view with the providers', () => {
    renderWithProviders(<App />)
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
    await expect(fetch(new URL('/not-mocked', window.location.origin))).rejects.toThrow()
  })
})
