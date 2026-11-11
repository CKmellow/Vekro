import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiError } from '../api/errors'
import {
  completeGoogleSignup,
  googleEnabled,
  pendingGoogleSignup,
  requestGoogleSignupCode,
  startGoogleLink,
  unlinkGoogle,
} from '../api/google'
import { sessionKeys } from './session'

export const googleKeys = {
  enabled: ['google', 'enabled'] as const,
  signup: ['google', 'signup'] as const,
}

/** Whether to offer Continue with Google at all (off while the server has no Google client). */
export const useGoogleEnabled = () =>
  useQuery({
    queryKey: googleKeys.enabled,
    queryFn: ({ signal }) => googleEnabled(signal),
    staleTime: 5 * 60_000,
    retry: false,
  })

/** The pending sign-up; `null` once it expired or never existed (410). */
export const usePendingGoogleSignup = () =>
  useQuery({
    queryKey: googleKeys.signup,
    queryFn: async ({ signal }) => {
      try {
        return await pendingGoogleSignup(signal)
      } catch (error) {
        if (error instanceof ApiError && error.status === 410) return null
        throw error
      }
    },
    retry: false,
  })

export const useRequestGoogleSignupCode = () =>
  useMutation({ mutationFn: (phone: string) => requestGoogleSignupCode(phone), meta: { auth: true } })

export function useCompleteGoogleSignup() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) => completeGoogleSignup(phone, code),
    meta: { auth: true },
    onSuccess: (user) => {
      client.setQueryData(sessionKeys.expired, false)
      client.setQueryData(sessionKeys.me, user)
      client.removeQueries({ queryKey: googleKeys.signup })
    },
  })
}

export const useStartGoogleLink = () =>
  useMutation({ mutationFn: (returnTo: string) => startGoogleLink(returnTo) })

export function useUnlinkGoogle() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: unlinkGoogle,
    onSuccess: () => void client.invalidateQueries({ queryKey: sessionKeys.me }),
  })
}
