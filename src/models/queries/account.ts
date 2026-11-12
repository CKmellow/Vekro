import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  changePassword,
  changePhone,
  getNotificationPrefs,
  listSessions,
  requestPhoneChangeCode,
  requestResetCode,
  resetPassword,
  revokeOtherSessions,
  revokeSession,
  saveNotificationPrefs,
  setSmsLogin,
  setUssdPin,
  updateName,
  type NotificationPrefs,
} from '@/models/api/account'
import { sessionKeys } from './session'

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

/** Profile writes change what /auth/me says: refresh the session afterwards. */
function useProfileMutation<V, R>(run: (v: V) => Promise<R>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSettled: () => {
      void client.invalidateQueries({ queryKey: sessionKeys.me })
      void client.invalidateQueries({ queryKey: accountKeys.sessions })
    },
  })
}

export const useUpdateName = () => useProfileMutation((name: string) => updateName(name))
export const useRequestPhoneChangeCode = () =>
  useMutation({ mutationFn: (phone: string) => requestPhoneChangeCode(phone) })
export const useChangePhone = () =>
  useProfileMutation((v: { phone: string; code: string }) => changePhone(v.phone, v.code))
export const useSetSmsLogin = () => useProfileMutation((enabled: boolean) => setSmsLogin(enabled))
export const useSetUssdPin = () =>
  useMutation({ mutationFn: (v: { pin: string; password: string }) => setUssdPin(v.pin, v.password) })
