import { useCurrentUser, useSessionExpired, type CurrentUser, type Role } from '@/models/queries/session'

export type SessionState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'anonymous'; expired: boolean }
  | { status: 'authenticated'; user: CurrentUser; role: Role }

export function useSession(): SessionState {
  const query = useCurrentUser()
  const expired = useSessionExpired()
  if (query.isPending) return { status: 'loading' }
  if (query.isError) return { status: 'error', retry: () => void query.refetch() }
  if (!query.data) return { status: 'anonymous', expired }
  return { status: 'authenticated', user: query.data, role: query.data.role }
}

export type { Role }
