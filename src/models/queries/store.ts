import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { closeStore, getCloseCheck, reopenStore, startSelling } from '@/models/api/store'
import { sessionKeys } from './session'

export const storeKeys = { closeCheck: ['store', 'close-check'] as const }

/** Store changes change what /auth/me says (store status) and which listings are live. */
function useStoreMutation<V>(run: (v: V) => Promise<void>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: sessionKeys.me })
      void client.invalidateQueries({ queryKey: storeKeys.closeCheck })
      void client.invalidateQueries({ queryKey: ['listings'] })
    },
  })
}

export const useStartSelling = () =>
  useStoreMutation((v: { shopName: string; shopArea?: string }) => startSelling(v))
export const useCloseStore = () => useStoreMutation(() => closeStore())
export const useReopenStore = () => useStoreMutation(() => reopenStore())

export const useCloseCheck = (enabled: boolean) =>
  useQuery({ queryKey: storeKeys.closeCheck, queryFn: ({ signal }) => getCloseCheck(signal), enabled })
