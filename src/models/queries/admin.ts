import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { decideCase, getCase, listCases, searchTransactions } from '@/models/api/admin'
import type { AdminSearchFilter, CaseStatusFilter } from '@/models/domain/adminCase'

export const adminKeys = {
  all: ['admin'] as const,
  cases: (status: CaseStatusFilter, page: number) => ['admin', 'cases', status, page] as const,
  case: (id: string) => ['admin', 'case', id] as const,
  search: (filter: AdminSearchFilter) => ['admin', 'search', filter] as const,
}

/** The queue; refreshes every minute while the console is open. */
export const useCases = (status: CaseStatusFilter, page: number, options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: adminKeys.cases(status, page),
    queryFn: ({ signal }) => listCases({ status, page, pageSize: 25 }, signal),
    enabled: options.enabled ?? true,
    refetchInterval: 60_000,
    placeholderData: (previous) => previous,
  })

export const useCase = (id: string) =>
  useQuery({ queryKey: adminKeys.case(id), queryFn: ({ signal }) => getCase(id, signal) })

export function useDecideCase(id: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({
      decision,
      reason,
      sellerShare,
    }: {
      decision: 'refund' | 'release' | 'split'
      reason: string
      sellerShare?: number
    }) => decideCase(id, decision, reason, sellerShare),
    onSettled: () => client.invalidateQueries({ queryKey: adminKeys.all }),
  })
}

export const useTransactionSearch = (filter: AdminSearchFilter) =>
  useQuery({
    queryKey: adminKeys.search(filter),
    queryFn: ({ signal }) => searchTransactions(filter, signal),
    placeholderData: (previous) => previous,
  })
