import { formatEat } from '@/lib/time'
import { useSyncExternalStore } from 'react'

const subscribe = (onChange: () => void) => {
  window.addEventListener('online', onChange)
  window.addEventListener('offline', onChange)
  return () => {
    window.removeEventListener('online', onChange)
    window.removeEventListener('offline', onChange)
  }
}

/** Whether the browser thinks it is online. A failed request is still the real test. */
export function useOnline(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  )
}

/**
 * "14:36" (EAT) when the browser is offline and the page is showing data fetched earlier, so the
 * view can say how old it is; null otherwise.
 */
export function useStaleSince(query: { data?: unknown; dataUpdatedAt: number }): string | null {
  const online = useOnline()
  return !online && query.data !== undefined && query.dataUpdatedAt
    ? formatEat(new Date(query.dataUpdatedAt).toISOString())
    : null
}
