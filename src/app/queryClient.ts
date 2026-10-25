import { onlineManager, QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/models/api/errors'
import { watchSessionExpiry } from '@/models/queries/session'

const NO_RETRY = new Set(['unauthorized', 'forbidden', 'not_found', 'conflict', 'validation'])

export function createQueryClient() {
  // Start from the browser's own view, so a page opened offline pauses its queries at once
  // (and shows the offline page) instead of waiting out the retries.
  onlineManager.setOnline(navigator.onLine)
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Client errors won't fix themselves; retry only network and server failures.
        retry: (count, error) => !(error instanceof ApiError && NO_RETRY.has(error.kind)) && count < 2,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  })
  watchSessionExpiry(client)
  return client
}
