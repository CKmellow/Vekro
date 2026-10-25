import { useEffect, useState } from 'react'
import { useBlocker, useSearchParams } from 'react-router'

export type SettingsTab = 'profile' | 'payout' | 'notifications' | 'security'

export const SETTINGS_TABS: { value: SettingsTab; label: string }[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'payout', label: 'Payout' },
]

const isTab = (v: string | null): v is SettingsTab => SETTINGS_TABS.some((t) => t.value === v)

/**
 * S13 shell (design/S13-settings): the tab lives in the URL (?tab=payout). With unsaved edits,
 * switching tabs or leaving the page asks first; closing the browser tab gets the native warning.
 */
export function useSettings({ dirty, discard }: { dirty: boolean; discard: () => void }) {
  const [params, setParams] = useSearchParams()
  const tab: SettingsTab = isTab(params.get('tab')) ? (params.get('tab') as SettingsTab) : 'profile'
  const [pendingTab, setPendingTab] = useState<SettingsTab | null>(null)
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) => dirty && currentLocation.pathname !== nextLocation.pathname,
  )

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const go = (next: SettingsTab) =>
    setParams((current) => {
      const out = new URLSearchParams(current)
      if (next === 'profile') out.delete('tab')
      else out.set('tab', next)
      return out
    })

  return {
    tabs: SETTINGS_TABS,
    tab,
    setTab: (next: string) => {
      if (!isTab(next) || next === tab) return
      if (dirty) setPendingTab(next)
      else go(next)
    },
    confirmOpen: pendingTab !== null || blocker.state === 'blocked',
    keepEditing: () => {
      setPendingTab(null)
      if (blocker.state === 'blocked') blocker.reset()
    },
    confirmDiscard: () => {
      discard()
      if (pendingTab) go(pendingTab)
      setPendingTab(null)
      if (blocker.state === 'blocked') blocker.proceed()
    },
  }
}
