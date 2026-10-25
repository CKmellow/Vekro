import { useQuery } from '@tanstack/react-query'
import { getAnalytics, type AnalyticsRange } from '@/models/api/analytics'

export const useSellerAnalytics = (range: AnalyticsRange) =>
  useQuery({
    queryKey: ['seller', 'analytics', range] as const,
    queryFn: ({ signal }) => getAnalytics(range, signal),
    placeholderData: (previous) => previous,
    staleTime: 60_000,
  })
