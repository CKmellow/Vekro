import { useQuery } from '@tanstack/react-query'
import { api, type Schemas } from '@/models/api/client'
import { ApiError } from '@/models/api/errors'

export type CurrentUser = Schemas['LoginResponse']
export type Role = Schemas['UserRole']

export const sessionKeys = { me: ['session', 'me'] as const }

/** The signed-in user, or null when there is no session (401). */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await api.get('/auth/me', {})
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'unauthorized') return null
    throw error
  }
}

export function useCurrentUser() {
  return useQuery({ queryKey: sessionKeys.me, queryFn: fetchCurrentUser, staleTime: 60_000 })
}
