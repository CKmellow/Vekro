import type { CurrentUser, SentCode } from './auth'
import { API_BASE, api } from './client'

/**
 * Continue with Google (backend #324): OIDC with PKCE, state and nonce, all handled by the server. The
 * browser only navigates to the start URL; Google comes back to the server, which redirects here with
 * `?google=<result>`. Accounts are matched by Google's subject only, never by e-mail.
 */
export function googleStartUrl(returnTo?: string | null): string {
  const query = returnTo ? `?${new URLSearchParams({ return_to: returnTo })}` : ''
  return `${API_BASE}/auth/google/start${query}`
}

export const googleEnabled = async (signal?: AbortSignal): Promise<boolean> =>
  (await api.get('/auth/google/status', { signal })).enabled

export interface GoogleSignup {
  email: string
  name: string | null
}

/** The Google identity waiting for a verified phone, or null when there is none (410). */
export const pendingGoogleSignup = async (signal?: AbortSignal): Promise<GoogleSignup> => {
  const r = await api.get('/auth/google/signup', { signal })
  return { email: r.email, name: r.name ?? null }
}

export async function requestGoogleSignupCode(phone: string): Promise<SentCode> {
  const r = await api.post('/auth/google/signup/request-code', { body: { phone } })
  return {
    resendAfterSeconds: r.resend_after_seconds,
    expiresAt: r.expires_at,
    devCode: r.dev_code ?? undefined,
  }
}

export const completeGoogleSignup = (phone: string, code: string): Promise<CurrentUser> =>
  api.post('/auth/google/signup/complete', { body: { phone, code } })

/** Linking happens on Google's page: the server returns where to send the browser. */
export const startGoogleLink = async (returnTo: string): Promise<string> =>
  (await api.post('/account/google/link', { body: { return_to: returnTo } })).authorization_url

export const unlinkGoogle = async () => {
  await api.delete('/account/google', {})
}
