import { api, type Schemas } from './client'

export type PrefCategory = 'payment_received' | 'delivery' | 'returns' | 'support'
export type NotificationPrefs = Record<PrefCategory, { inApp: boolean; sms: boolean }>

const CATEGORIES: PrefCategory[] = ['payment_received', 'delivery', 'returns', 'support']

function toPrefs(raw: Schemas['NotificationPreferences']): NotificationPrefs {
  return Object.fromEntries(
    CATEGORIES.map((c) => [c, { inApp: raw[c].in_app, sms: raw[c].sms }]),
  ) as NotificationPrefs
}

/** GET/PUT /me/notification-preferences (backend #207). Support in the app is always on. */
export const getNotificationPrefs = async (signal?: AbortSignal) =>
  toPrefs(await api.get('/me/notification-preferences', { signal }))

export const saveNotificationPrefs = async (prefs: NotificationPrefs) =>
  toPrefs(
    await api.put('/me/notification-preferences', {
      body: Object.fromEntries(
        CATEGORIES.map((c) => [c, { in_app: prefs[c].inApp, sms: prefs[c].sms }]),
      ) as Schemas['NotificationPreferences'],
    }),
  )

/** Signs out every other device; returns how many. 400 when the current password is wrong. */
export const changePassword = async (currentPassword: string, newPassword: string) =>
  (
    await api.post('/auth/password/change', {
      body: { current_password: currentPassword, new_password: newPassword },
    })
  ).signed_out_devices

export interface DeviceSession {
  id: string
  device: string
  lastSeenAt: string
  current: boolean
}

export const listSessions = async (signal?: AbortSignal): Promise<DeviceSession[]> =>
  (await api.get('/auth/sessions', { signal })).map((s) => ({
    id: s.id,
    device: s.device,
    lastSeenAt: s.last_seen_at,
    current: s.current,
  }))

export const revokeSession = async (id: string) => {
  await api.delete('/auth/sessions/{session_id}', { path: { session_id: id } })
}

export const revokeOtherSessions = async () => (await api.post('/auth/sessions/revoke-others', {})).revoked

/** Always succeeds for a valid number, so it never reveals who has an account. */
export const requestResetCode = async (phone: string) => {
  const r = await api.post('/auth/password/reset/request-code', { body: { phone } })
  return { resendAfterSeconds: r.resend_after_seconds, devCode: r.dev_code ?? undefined }
}

export const resetPassword = async (phone: string, code: string, newPassword: string) => {
  await api.post('/auth/password/reset', { body: { phone, code, new_password: newPassword } })
}
