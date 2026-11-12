import type { Role, StoreSummary } from '@/models/api/auth'
import { readMode, type Mode } from '@/lib/mode'
import { safeReturnTo } from '@/lib/returnTo'

/**
 * Who is signing in (M21): one account buys and sells; selling needs a store; admins are separate.
 * A bare role still works for callers that only know it (an old session, a test).
 */
export interface Account {
  role: Role
  store?: Pick<StoreSummary, 'status'> | null
}

/** The buyer area's first page. */
export const BUYER_HOME = '/buyer'
export const SELLER_HOME = '/seller'
export const ADMIN_HOME = '/admin'

const asAccount = (who: Role | Account): Account =>
  typeof who === 'string' ? { role: who, store: who === 'seller' ? { status: 'active' } : null } : who

/** Has opened a store, open or closed: the seller area (history at least) is theirs. */
export const hasStore = (who: Role | Account) => {
  const account = asAccount(who)
  // No store field (a server from before M28): the derived role says whether it sells.
  const status = account.store ? account.store.status : account.role === 'seller' ? 'active' : 'none'
  return status === 'active' || status === 'closed'
}

const inArea = (path: string, area: string) => path === area || path.startsWith(`${area}/`)
const sellerPath = (path: string) => inArea(path, '/seller') || path === '/onboarding'

function belongs(account: Account, path: string): boolean {
  if (account.role === 'admin') return inArea(path, '/admin')
  if (inArea(path, '/admin')) return false
  if (sellerPath(path)) return hasStore(account)
  return true
}

const SIGN_IN_PAGES = new Set(['/login', '/admin/login', '/buyer/sign-in', '/register', '/forgot-password'])

/** Home with nowhere to go back to: admins their console; a store's owner their last mode (Selling
 * when none is saved); everyone else the buyer area. */
export function homeFor(who: Role | Account, lastMode: Mode | null = readMode()): string {
  const account = asAccount(who)
  if (account.role === 'admin') return ADMIN_HOME
  if (hasStore(account)) return lastMode === 'buying' ? BUYER_HOME : SELLER_HOME
  return BUYER_HOME
}

/**
 * Where to go after logging in: back to the page the person was sent away from when the account may
 * use it (same-site only), otherwise their home.
 */
export function destinationFor(
  who: Role | Account,
  returnTo: string | null | undefined,
  lastMode: Mode | null = readMode(),
): string {
  const account = asAccount(who)
  const home = homeFor(account, lastMode)
  const back = safeReturnTo(returnTo, home)
  const path = back.split(/[?#]/)[0] ?? back
  if (SIGN_IN_PAGES.has(path)) return home
  return belongs(account, path) ? back : home
}
