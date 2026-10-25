import { useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query'
import {
  authStrategy,
  PhoneVerifiedGuest,
  type Credentials,
  type CurrentUser,
  type Registration,
  type Role,
} from '@/models/api/auth'
import { api } from '@/models/api/client'
import { ApiError } from '@/models/api/errors'

export type { CurrentUser, Role }

export const sessionKeys = {
  me: ['session', 'me'] as const,
  /** In-memory flag: the session ended under the user (shows "Your session expired" on log in). */
  expired: ['session', 'expired'] as const,
}

/** The signed-in user, or null when there is no session (401). */
export async function fetchCurrentUser(): Promise<CurrentUser | null> {
  try {
    return await api.get('/auth/me', {})
  } catch (error) {
    if (error instanceof ApiError && error.kind === 'unauthorized') return null
    throw error
  }
}

const signedIn = (client: QueryClient) => Boolean(client.getQueryData<CurrentUser | null>(sessionKeys.me))

/** Drop the session from the cache and remember that it expired, so the guard can say so. */
export function markSessionExpired(client: QueryClient) {
  if (!signedIn(client)) return
  client.setQueryData(sessionKeys.expired, true)
  client.setQueryData(sessionKeys.me, null)
}

export function useSessionExpired(): boolean {
  return (
    useQuery({ queryKey: sessionKeys.expired, queryFn: () => false, staleTime: Infinity, gcTime: Infinity })
      .data === true
  )
}

export function useCurrentUser() {
  const client = useQueryClient()
  return useQuery({
    queryKey: sessionKeys.me,
    queryFn: async () => {
      const user = await fetchCurrentUser()
      if (!user) markSessionExpired(client)
      return user
    },
    staleTime: 60_000,
  })
}

/**
 * Any 401 from a query or mutation while signed in means the server session ended (expired or revoked).
 * Auth calls themselves (log in, register) opt out with `meta: { auth: true }`: their 401 is a wrong password.
 */
export function watchSessionExpiry(client: QueryClient) {
  const isExpiry = (error: unknown) => error instanceof ApiError && error.kind === 'unauthorized'
  const unsubscribeQueries = client.getQueryCache().subscribe((event) => {
    if (event.type !== 'updated' || event.action.type !== 'error') return
    if (event.query.queryKey[0] === 'session') return
    if (isExpiry(event.action.error)) markSessionExpired(client)
  })
  const unsubscribeMutations = client.getMutationCache().subscribe((event) => {
    const mutation = event.mutation
    if (event.type !== 'updated' || !mutation || mutation.state.status !== 'error') return
    if (mutation.meta?.auth) return
    if (isExpiry(mutation.state.error)) markSessionExpired(client)
  })
  return () => {
    unsubscribeQueries()
    unsubscribeMutations()
  }
}

function useSessionMutation<V>(run: (variables: V) => Promise<CurrentUser>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    meta: { auth: true },
    onSuccess: (user) => {
      client.setQueryData(sessionKeys.expired, false)
      client.setQueryData(sessionKeys.me, user)
    },
  })
}

export const useSignIn = () =>
  useSessionMutation((credentials: Credentials) => authStrategy.signIn(credentials))
export const useRegister = () =>
  useSessionMutation((registration: Registration) => authStrategy.register(registration))

/** B8: ask for an SMS sign-in code. */
export const useRequestPhoneCode = () =>
  useMutation({ mutationFn: (phone: string) => PhoneVerifiedGuest.requestCode(phone), meta: { auth: true } })

/** B8: verify the code; on success the buyer is signed in. */
export const useVerifyPhoneCode = () =>
  useSessionMutation(({ phone, code }: { phone: string; code: string }) =>
    PhoneVerifiedGuest.verifyCode(phone, code),
  )

export function useSignOut() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: () => authStrategy.signOut(),
    meta: { auth: true },
    // Signed out either way: an already-expired session also ends here.
    onSettled: () => {
      client.removeQueries({ predicate: (q) => q.queryKey[0] !== 'session' })
      client.setQueryData(sessionKeys.expired, false)
      client.setQueryData(sessionKeys.me, null)
    },
  })
}
