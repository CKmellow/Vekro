/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  THEME_STORAGE_KEY,
  applyTheme,
  readPreference,
  resolveTheme,
  themeStore,
  writePreference,
} from './theme'

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const data = new Map(Object.entries(initial))
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (k) => data.get(k) ?? null,
    key: (i) => [...data.keys()][i] ?? null,
    removeItem: (k) => void data.delete(k),
    setItem: (k, v) => void data.set(k, v),
  }
}

const blocked = {
  getItem: () => {
    throw new DOMException('blocked', 'SecurityError')
  },
  setItem: () => {
    throw new DOMException('blocked', 'SecurityError')
  },
  removeItem: () => {
    throw new DOMException('blocked', 'SecurityError')
  },
} as unknown as Storage

afterEach(() => {
  document.documentElement.classList.remove('dark')
  document.documentElement.style.colorScheme = ''
  localStorage.clear()
  themeStore.reset()
})

describe('theme preference (M25, #292)', () => {
  it('is "system" unless a valid choice is stored', () => {
    expect(readPreference(memoryStorage())).toBe('system')
    expect(readPreference(memoryStorage({ [THEME_STORAGE_KEY]: 'dark' }))).toBe('dark')
    expect(readPreference(memoryStorage({ [THEME_STORAGE_KEY]: 'purple' }))).toBe('system')
    expect(readPreference(undefined)).toBe('system')
  })

  it('falls back to system when storage is blocked, and never throws', () => {
    expect(readPreference(blocked)).toBe('system')
    expect(() => writePreference('dark', blocked)).not.toThrow()
  })

  it('stores light or dark, and forgets the choice for system', () => {
    const store = memoryStorage()
    writePreference('dark', store)
    expect(store.getItem(THEME_STORAGE_KEY)).toBe('dark')
    writePreference('system', store)
    expect(store.getItem(THEME_STORAGE_KEY)).toBeNull()
  })

  it('follows the device only for system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('applies the class, color-scheme and browser colour', () => {
    const meta = document.createElement('meta')
    meta.name = 'theme-color'
    document.head.append(meta)
    applyTheme('dark')
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(meta.content).toBe('#07110E')
    applyTheme('light')
    expect(document.documentElement).not.toHaveClass('dark')
    expect(meta.content).toBe('#FBF9F4')
    meta.remove()
  })

  it('tells every subscriber when the choice changes', () => {
    const listener = vi.fn()
    const unsubscribe = themeStore.subscribe(listener)
    themeStore.setPreference('dark')
    expect(listener).toHaveBeenCalledTimes(1)
    expect(themeStore.getPreference()).toBe('dark')
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    expect(document.documentElement).toHaveClass('dark')
    unsubscribe()
  })
})

describe('public/theme-init.js (before first paint)', () => {
  const script = readFileSync('public/theme-init.js', 'utf8')
  const run = (stored: string | null, systemDark: boolean) => {
    if (stored) localStorage.setItem(THEME_STORAGE_KEY, stored)
    vi.stubGlobal('matchMedia', (q: string) => ({ matches: systemDark && q.includes('dark') }))
    new Function(script)()
    vi.unstubAllGlobals()
    return document.documentElement.classList.contains('dark')
  }

  it.each([
    [null, true, true],
    [null, false, false],
    ['light', true, false],
    ['dark', false, true],
  ])(
    'stored %s with a dark device %s gives dark %s, the same rule as the app',
    (stored, systemDark, dark) => {
      expect(run(stored, systemDark)).toBe(dark)
      expect(resolveTheme(readPreference(), systemDark) === 'dark').toBe(dark)
    },
  )
})
