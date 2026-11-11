import { describe, expect, it } from 'vitest'
import { dismissInstallHint, INSTALL_HINT_STORAGE_KEY, installHintDismissed } from './installHint'

function memory(): Storage {
  const data = new Map<string, string>()
  return {
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
    clear: () => data.clear(),
    key: () => null,
    get length() {
      return data.size
    },
  }
}

describe('installHint (#304)', () => {
  it('remembers a dismissal on this device', () => {
    const store = memory()
    expect(installHintDismissed(store)).toBe(false)
    dismissInstallHint(store)
    expect(store.getItem(INSTALL_HINT_STORAGE_KEY)).toBe('dismissed')
    expect(installHintDismissed(store)).toBe(true)
  })

  it('survives blocked storage', () => {
    const blocked = {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
    } as unknown as Storage
    expect(installHintDismissed(blocked)).toBe(false)
    expect(() => dismissInstallHint(blocked)).not.toThrow()
  })
})
