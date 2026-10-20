import { http, HttpResponse } from 'msw'
import { server } from './server'

type Role = 'buyer' | 'seller' | 'admin'

/** A `GET /auth/me` body for the sample seller in PAGES.md 0.1. */
export const sampleUser = (role: Role) => ({
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  name: 'Amina Gadgets',
  phone: '+254722118904',
  role,
  mpesa_phone: role === 'seller' ? '+254722118904' : null,
  mpesa_account_name: role === 'seller' ? 'Amina Wanjiru' : null,
  is_active: true,
  created_at: '2026-10-15T09:00:00Z',
  session_expires_at: '2026-10-22T09:00:00Z',
})

/** Serves `GET /api/auth/me` as that role, or as signed out (401) for `null`. */
export function signedInAs(role: Role | null) {
  server.use(
    http.get('/api/auth/me', () =>
      role
        ? HttpResponse.json(sampleUser(role))
        : HttpResponse.json({ detail: 'Authentication required.' }, { status: 401 }),
    ),
  )
}
