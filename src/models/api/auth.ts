import { api, type Schemas } from './client'

export type CurrentUser = Schemas['LoginResponse']
export type Role = Schemas['UserRole']

export interface Credentials {
  /** E.164, for example +254722118904. */
  phone: string
  password: string
}

export interface Registration extends Credentials {
  name: string
  role: Extract<Role, 'seller' | 'buyer'>
  mpesaPhone?: string
}

/**
 * How a person proves who they are with a password: sellers, admins, and buyers saving their details on
 * B1. Passwordless buyer sign-in (B8) uses PhoneVerifiedGuest below.
 */
export interface AuthStrategy {
  readonly kind: 'password-account' | 'phone-verified-guest'
  signIn(credentials: Credentials): Promise<CurrentUser>
  /** Creates the account and signs in. */
  register(registration: Registration): Promise<CurrentUser>
  signOut(): Promise<void>
}

/** Phone + password accounts: today's backend. The session lives in an httpOnly cookie, never in browser storage. */
export const PasswordAccount: AuthStrategy = {
  kind: 'password-account',
  signIn: (credentials) => api.post('/auth/login', { body: credentials }),
  async register({ name, phone, password, role, mpesaPhone }) {
    await api.post('/auth/register', {
      body: { name, phone, password, role, mpesa_phone: mpesaPhone ?? null },
    })
    // Registering does not start a session; log in with the same credentials.
    return api.post('/auth/login', { body: { phone, password } })
  },
  signOut: async () => {
    await api.post('/auth/logout', {})
  },
}

/** The strategy in use. */
export const authStrategy: AuthStrategy = PasswordAccount

export interface SentCode {
  /** Seconds before another code can be asked for. */
  resendAfterSeconds: number
  expiresAt: string
  /** Only from a local or e2e backend with PHONE_CODE_DEV_ECHO on; never in production. */
  devCode?: string
}

/**
 * Buyer sign-in without a password (B8, backend #201): a 6-digit SMS code opens the same cookie session.
 * The server finds or creates the buyer for the phone. An order ID plus phone is never a credential.
 */
export const PhoneVerifiedGuest = {
  kind: 'phone-verified-guest' as const,
  async requestCode(phone: string): Promise<SentCode> {
    const r = await api.post('/auth/phone/request-code', { body: { phone } })
    return {
      resendAfterSeconds: r.resend_after_seconds,
      expiresAt: r.expires_at,
      devCode: r.dev_code ?? undefined,
    }
  },
  verifyCode: (phone: string, code: string): Promise<CurrentUser> =>
    api.post('/auth/phone/verify', { body: { phone, code } }),
}
