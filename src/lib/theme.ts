/**
 * Light / dark theme (M25, #292). The preference is "system" unless the person picks one; it lives in
 * localStorage on this device only. public/theme-init.js applies the same rule before first paint, so
 * pages never flash the wrong theme. Storage can be missing or blocked: everything falls back to system.
 */
export type ThemePreference = 'light' | 'dark' | 'system'
export type Theme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'vekro.theme'
const PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system']
/** Browser chrome colour per theme: DESIGN.md background and dark-background. */
export const THEME_COLOR: Record<Theme, string> = { light: '#FBF9F4', dark: '#07110E' }
const DARK_QUERY = '(prefers-color-scheme: dark)'

function storage(): Storage | undefined {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

export function readPreference(store: Storage | undefined = storage()): ThemePreference {
  try {
    const value = store?.getItem(THEME_STORAGE_KEY)
    return PREFERENCES.includes(value as ThemePreference) ? (value as ThemePreference) : 'system'
  } catch {
    return 'system'
  }
}

export function writePreference(preference: ThemePreference, store: Storage | undefined = storage()): void {
  try {
    if (preference === 'system') store?.removeItem(THEME_STORAGE_KEY)
    else store?.setItem(THEME_STORAGE_KEY, preference)
  } catch {
    // Blocked storage: the choice lasts for this page only.
  }
}

export function systemPrefersDark(): boolean {
  return typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(DARK_QUERY).matches
    : false
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): Theme {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}

export function applyTheme(theme: Theme, doc: Document | undefined = globalThis.document): void {
  if (!doc) return
  const root = doc.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.style.colorScheme = theme
  doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme])
}

type Listener = () => void
const listeners = new Set<Listener>()
let current: ThemePreference | null = null

/** A tiny store so every switch on the page shows the same choice. */
export const themeStore = {
  getPreference(): ThemePreference {
    current ??= readPreference()
    return current
  },
  setPreference(preference: ThemePreference): void {
    current = preference
    writePreference(preference)
    applyTheme(resolveTheme(preference, systemPrefersDark()))
    listeners.forEach((listener) => listener())
  },
  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
  /** Follow the device while the preference is "system". Returns the cleanup. */
  followSystem(): () => void {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
    const query = window.matchMedia(DARK_QUERY)
    const onChange = () => {
      if (themeStore.getPreference() === 'system') applyTheme(resolveTheme('system', query.matches))
      listeners.forEach((listener) => listener())
    }
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  },
  /** Tests only. */
  reset(): void {
    current = null
  },
}
