/**
 * Whether this device dismissed the "Install Vekro" hint (#304). A display preference on this device
 * only, like the theme; never a session. Blocked storage means the hint can come back next visit.
 */
export const INSTALL_HINT_STORAGE_KEY = 'vekro.installHint'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function installHintDismissed(store: Storage | undefined = storage()): boolean {
  try {
    return store?.getItem(INSTALL_HINT_STORAGE_KEY) === 'dismissed'
  } catch {
    return false
  }
}

export function dismissInstallHint(store: Storage | undefined = storage()): void {
  try {
    store?.setItem(INSTALL_HINT_STORAGE_KEY, 'dismissed')
  } catch {
    // Blocked storage: hidden for this page only.
  }
}
