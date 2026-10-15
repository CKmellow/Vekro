import { useCurrentUser, type CurrentUser, type Role } from '@/models/queries/session'

export type SessionState =
  | { status: 'loading' }
  | { status: 'error'; retry: () => void }
  | { status: 'anonymous' }
  | { status: 'authenticated'; user: CurrentUser; role: Role }

export function useSession(): SessionState {
  const query = useCurrentUser()
  if (query.isPending) return { status: 'loading' }
  if (query.isError) return { status: 'error', retry: () => void query.refetch() }
  if (!query.data) return { status: 'anonymous' }
  return { status: 'authenticated', user: query.data, role: query.data.role }
}

export type { Role }
