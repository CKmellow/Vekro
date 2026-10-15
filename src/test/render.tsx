import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, renderHook, type RenderOptions } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement, ReactNode } from 'react'

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false } },
  })
}

function Providers({ children, client }: { children: ReactNode; client: QueryClient }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

/** Render with the app providers. Returns RTL queries plus a userEvent instance. */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  const client = createTestQueryClient()
  return {
    user: userEvent.setup(),
    client,
    ...render(ui, {
      wrapper: ({ children }) => <Providers client={client}>{children}</Providers>,
      ...options,
    }),
  }
}

/** Render a hook (controllers, query hooks) with the app providers. */
export function renderHookWithProviders<T>(hook: () => T) {
  const client = createTestQueryClient()
  return {
    client,
    ...renderHook(hook, { wrapper: ({ children }) => <Providers client={client}>{children}</Providers> }),
  }
}
