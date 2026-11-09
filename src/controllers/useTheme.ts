import { useEffect, useSyncExternalStore } from 'react'
import { themeStore, type ThemePreference } from '@/lib/theme'

/** The theme switch (M25, #292): the person's choice, kept in sync across every switch on the page. */
export function useTheme() {
  const preference = useSyncExternalStore(
    themeStore.subscribe,
    themeStore.getPreference,
    () => 'system' as const,
  )
  useEffect(() => themeStore.followSystem(), [])
  return {
    preference,
    setPreference: (value: ThemePreference) => themeStore.setPreference(value),
  }
}
