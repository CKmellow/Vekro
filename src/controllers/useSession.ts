import { ApiError } from '@/models/api/errors'
import type { Account } from '@/models/domain/roleHome'
import { useCurrentUser, useSessionExpired, type CurrentUser, type Role } from '@/models/queries/session'

export type SessionState =
  /** offline: the check is paused until the browser is back online. */
  | { status: 'loading'; offline?: boolean }
  | { status: 'error'; retry: () => void; offline?: boolean }
  | { status: 'anonymous'; expired: boolean }
  | { status: 'authenticated'; user: CurrentUser; role: Role; account: Account }

export function useSession(): SessionState {
  const query = useCurrentUser()
  const expired = useSessionExpired()
  // No response at all is offline too: phones with no data often still report navigator.onLine (#304).
  const offline = !navigator.onLine || (query.error instanceof ApiError && query.error.kind === 'network')
  if (query.isPending) return { status: 'loading', offline: query.fetchStatus === 'paused' || undefined }
  if (query.isError)
    return { status: 'error', retry: () => void query.refetch(), offline: offline || undefined }
  if (!query.data) return { status: 'anonymous', expired }
  const user = query.data
  return { status: 'authenticated', user, role: user.role, account: { role: user.role, store: user.store } }
}

export type { Account, Role }
