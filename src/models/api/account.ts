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

export interface Profile {
  name: string
  phone: string
  googleEmail: string | null
}

const toProfile = (raw: Schemas['ProfileResponse']): Profile => ({
  name: raw.name,
  phone: raw.phone,
  googleEmail: raw.google_email ?? null,
})

/** PATCH /account/profile (M21, B12): the account's name. */
export const updateName = async (name: string) =>
  toProfile(await api.patch('/account/profile', { body: { name } }))

/** POST /account/phone/request-code: a code to the new sign-in number. 409 taken, 422 same number. */
export const requestPhoneChangeCode = async (phone: string) => {
  const r = await api.post('/account/phone/request-code', { body: { phone } })
  return { resendAfterSeconds: r.resend_after_seconds, devCode: r.dev_code ?? undefined }
}

/** PUT /account/phone: the new sign-in number with its code; other devices are signed out. */
export const changePhone = async (phone: string, code: string) =>
  toProfile(await api.put('/account/phone', { body: { phone, code } }))

/** PUT /account/sms-login: SMS-code sign-in on or off. 409 while it is the only way in. */
export const setSmsLogin = async (enabled: boolean) =>
  (await api.put('/account/sms-login', { body: { enabled } })).enabled

/** POST /account/ussd-pin: the 4-digit PIN for sensitive USSD actions; needs the password (403 wrong). */
export const setUssdPin = async (pin: string, password: string) => {
  await api.post('/account/ussd-pin', { body: { pin, password } })
}
