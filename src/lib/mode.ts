/**
 * Buying or Selling (M21, X4): the area an account with a store opened last. A UI preference on this
 * device only (localStorage `vekro.mode`); the server never reads it. Storage can be missing or
 * blocked: then there is no saved mode and accounts with a store land in Selling.
 */
export type Mode = 'buying' | 'selling'

export const MODE_STORAGE_KEY = 'vekro.mode'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function readMode(store: Storage | undefined = storage()): Mode | null {
  try {
    const value = store?.getItem(MODE_STORAGE_KEY)
    return value === 'buying' || value === 'selling' ? value : null
  } catch {
    return null
  }
}

export function writeMode(mode: Mode, store: Storage | undefined = storage()): void {
  try {
    store?.setItem(MODE_STORAGE_KEY, mode)
  } catch {
    // Blocked storage: the choice lasts for this page only.
  }
}
