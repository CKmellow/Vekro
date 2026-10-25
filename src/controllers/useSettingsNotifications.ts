import { useState } from 'react'
import { toast } from '@/lib/toast'
import type { NotificationPrefs, PrefCategory } from '@/models/api/account'
import { ApiError } from '@/models/api/errors'
import { useNotificationPrefs, useSaveNotificationPrefs } from '@/models/queries/account'

export const PREF_ROWS: { category: PrefCategory; label: string }[] = [
  { category: 'payment_received', label: 'Payment received' },
  { category: 'delivery', label: 'Dispatch and delivery' },
  { category: 'returns', label: 'Return updates' },
  { category: 'support', label: 'Support messages' },
]

/** Support decisions always show in the app, so a decision about money is never missed. */
export const isLocked = (category: PrefCategory, channel: 'inApp' | 'sms') =>
  category === 'support' && channel === 'inApp'

/** S13 Notifications tab: an in-app and SMS switch per category, saved from the save bar. */
export function useSettingsNotifications() {
  const query = useNotificationPrefs()
  const save = useSaveNotificationPrefs()
  const [edits, setEdits] = useState<NotificationPrefs | null>(null)
  const [error, setError] = useState<string | null>(null)
  const saved = query.data
  const prefs = edits ?? saved
  const dirty =
    Boolean(edits && saved) &&
    PREF_ROWS.some(
      ({ category: c }) => edits?.[c].inApp !== saved?.[c].inApp || edits?.[c].sms !== saved?.[c].sms,
    )

  return {
    state: saved ? ('ready' as const) : query.isError ? ('error' as const) : ('loading' as const),
    retry: () => void query.refetch(),
    rows: PREF_ROWS.map((row) => ({
      ...row,
      inApp: prefs?.[row.category].inApp ?? true,
      sms: prefs?.[row.category].sms ?? true,
      inAppLocked: isLocked(row.category, 'inApp'),
    })),
    toggle: (category: PrefCategory, channel: 'inApp' | 'sms') => {
      if (!prefs || isLocked(category, channel)) return
      setEdits({ ...prefs, [category]: { ...prefs[category], [channel]: !prefs[category][channel] } })
    },
    dirty,
    saving: save.isPending,
    save: async () => {
      if (!edits) return
      setError(null)
      try {
        await save.mutateAsync(edits)
        setEdits(null)
        toast.show('Settings saved', 'success')
      } catch (e) {
        setError(
          e instanceof ApiError && e.kind === 'network'
            ? "You're offline. Your choices are still here; save again when you're connected."
            : "We couldn't save your notification settings. Try again.",
        )
      }
    },
    discard: () => {
      setEdits(null)
      setError(null)
    },
    error,
  }
}
