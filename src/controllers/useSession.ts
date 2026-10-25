import { useCurrentUser, useSessionExpired, type CurrentUser, type Role } from '@/models/queries/session'

export type SessionState =
  /** offline: the check is paused until the browser is back online. */
  | { status: 'loading'; offline?: boolean }
  | { status: 'error'; retry: () => void; offline?: boolean }
  | { status: 'anonymous'; expired: boolean }
  | { status: 'authenticated'; user: CurrentUser; role: Role }

export function useSession(): SessionState {
  const query = useCurrentUser()
  const expired = useSessionExpired()
  const offline = !navigator.onLine
  if (query.isPending) return { status: 'loading', offline: query.fetchStatus === 'paused' || undefined }
  if (query.isError)
    return { status: 'error', retry: () => void query.refetch(), offline: offline || undefined }
  if (!query.data) return { status: 'anonymous', expired }
  return { status: 'authenticated', user: query.data, role: query.data.role }
}

export type { Role }
