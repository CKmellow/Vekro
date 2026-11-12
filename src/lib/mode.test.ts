import { describe, expect, it } from 'vitest'
import { MODE_STORAGE_KEY, readMode, writeMode } from './mode'

const memory = () => {
  const items = new Map<string, string>()
  return {
    getItem: (k: string) => items.get(k) ?? null,
    setItem: (k: string, v: string) => void items.set(k, v),
  } as unknown as Storage
}

describe('mode', () => {
  it('remembers buying or selling and ignores anything else', () => {
    const store = memory()
    expect(readMode(store)).toBeNull()
    writeMode('buying', store)
    expect(readMode(store)).toBe('buying')
    store.setItem(MODE_STORAGE_KEY, 'admin')
    expect(readMode(store)).toBeNull()
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
    expect(readMode(blocked)).toBeNull()
    expect(() => writeMode('selling', blocked)).not.toThrow()
  })
})
