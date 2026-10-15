import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/models/api/errors'

const NO_RETRY = new Set(['unauthorized', 'forbidden', 'not_found', 'conflict', 'validation'])

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Client errors won't fix themselves; retry only network and server failures.
        retry: (count, error) => !(error instanceof ApiError && NO_RETRY.has(error.kind)) && count < 2,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  })
}
