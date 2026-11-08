import type { Role } from '@/models/api/auth'
import { safeReturnTo } from '@/lib/returnTo'

/** Each role's own area: where a person lands after logging in when there is nowhere to go back to. */
export const HOME: Record<Role, string> = { admin: '/admin', seller: '/seller', buyer: '/buyer/orders' }

const inArea = (path: string, area: string) => path === area || path.startsWith(`${area}/`)

const BELONGS: Record<Role, (path: string) => boolean> = {
  admin: (path) => inArea(path, '/admin'),
  seller: (path) => inArea(path, '/seller') || path === '/onboarding',
  buyer: (path) => !inArea(path, '/admin') && !inArea(path, '/seller') && path !== '/onboarding',
}

const SIGN_IN_PAGES = new Set(['/login', '/admin/login', '/buyer/sign-in', '/register', '/forgot-password'])

/**
 * Where to go after logging in: back to the page the person was sent away from when it is inside
 * their own area (same-site only), otherwise their area's home.
 */
export function destinationFor(role: Role, returnTo: string | null | undefined): string {
  const back = safeReturnTo(returnTo, HOME[role])
  const path = back.split(/[?#]/)[0] ?? back
  if (SIGN_IN_PAGES.has(path)) return HOME[role]
  return BELONGS[role](path) ? back : HOME[role]
}
