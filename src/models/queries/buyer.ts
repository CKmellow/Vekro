import { useQuery } from '@tanstack/react-query'
import { getBuyerHome } from '@/models/api/buyer'

export const buyerKeys = { home: ['orders', 'buyer-home'] as const }

/** B10: polls every 15s while a deadline runs (an item at the door, the 24-hour check, a return). */
export const useBuyerHome = (options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: buyerKeys.home,
    queryFn: ({ signal }) => getBuyerHome(signal),
    enabled: options.enabled ?? true,
    refetchInterval: (query) => (query.state.data?.needsYou.some((n) => n.dueAt) ? 15_000 : 60_000),
    refetchIntervalInBackground: false,
  })
