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
 * How a person proves who they are. Screens only talk to this interface, so the buyer flow can move from
 * PasswordAccount to PhoneVerifiedGuest (backend-gap #11) without touching them.
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
