import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changePassword,
  getNotificationPrefs,
  listSessions,
  requestResetCode,
  resetPassword,
  revokeOtherSessions,
  revokeSession,
  saveNotificationPrefs,
  type NotificationPrefs,
} from '@/models/api/account'

export const accountKeys = {
  prefs: ['account', 'prefs'] as const,
  sessions: ['account', 'sessions'] as const,
}

export const useNotificationPrefs = () =>
  useQuery({ queryKey: accountKeys.prefs, queryFn: ({ signal }) => getNotificationPrefs(signal) })

export function useSaveNotificationPrefs() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (prefs: NotificationPrefs) => saveNotificationPrefs(prefs),
    onSuccess: (prefs) => client.setQueryData(accountKeys.prefs, prefs),
  })
}

export const useSessions = () =>
  useQuery({ queryKey: accountKeys.sessions, queryFn: ({ signal }) => listSessions(signal) })

function useSessionsMutation<V, R>(run: (v: V) => Promise<R>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSettled: () => client.invalidateQueries({ queryKey: accountKeys.sessions }),
  })
}

export const useChangePassword = () =>
  useSessionsMutation((v: { current: string; next: string }) => changePassword(v.current, v.next))
export const useRevokeSession = () => useSessionsMutation((id: string) => revokeSession(id))
export const useRevokeOtherSessions = () => useSessionsMutation(() => revokeOtherSessions())

export const useRequestResetCode = () =>
  useMutation({ mutationFn: (phone: string) => requestResetCode(phone), meta: { auth: true } })
export const useResetPassword = () =>
  useMutation({
    mutationFn: (v: { phone: string; code: string; password: string }) =>
      resetPassword(v.phone, v.code, v.password),
    meta: { auth: true },
  })
