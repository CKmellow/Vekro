import { useState } from 'react'
import { formatEat, formatEatFull, formatRelative } from '@/lib/time'
import { toast } from '@/lib/toast'
import type { AppNotification, NotificationEvent } from '@/models/domain/notification'
import { useMarkAllRead, useMarkRead, useNotifications } from '@/models/queries/notifications'
import { useOnline } from './useOnline'

export type NotificationKind = 'money' | 'delivery' | 'problem' | 'support' | 'time' | 'other'

const KIND: Record<NotificationEvent, NotificationKind> = {
  transaction_created: 'other',
  transaction_locked: 'money',
  otp_given: 'money',
  transaction_dispatched: 'delivery',
  delivery_arrived: 'delivery',
  otp_withheld: 'problem',
  dispute_opened: 'problem',
  dispute_updated: 'problem',
  admin_decision: 'support',
  system_timeout: 'time',
}

export interface NotificationRow {
  id: string
  kind: NotificationKind
  title: string
  detail: string
  time: string
  timeFull: string
  at: string
  unread: boolean
  to: string
}

export interface NotificationGroup {
  label: 'Today' | 'Yesterday' | 'Earlier'
  rows: NotificationRow[]
}

const dayKey = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Nairobi',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Return and dispute events open the return case; everything else opens the order. */
export function linkFor(n: Pick<AppNotification, 'event' | 'orderId'>): string {
  return n.event === 'dispute_opened' || n.event === 'dispute_updated'
    ? `/seller/returns/${n.orderId}`
    : `/seller/orders/${n.orderId}`
}

/** Today, Yesterday and Earlier by the EAT calendar day, newest first, empty groups dropped. */
export function groupByDay(items: AppNotification[], now = new Date()): NotificationGroup[] {
  const today = dayKey.format(now)
  const yesterday = dayKey.format(new Date(now.getTime() - 86_400_000))
  const groups: NotificationGroup[] = [
    { label: 'Today', rows: [] },
    { label: 'Yesterday', rows: [] },
    { label: 'Earlier', rows: [] },
  ]
  for (const n of items) {
    const key = dayKey.format(new Date(n.createdAt))
    const group = key === today ? groups[0] : key === yesterday ? groups[1] : groups[2]
    group?.rows.push({
      id: n.id,
      kind: KIND[n.event] ?? 'other',
      title: n.title,
      detail: n.message,
      time: formatRelative(n.createdAt, now),
      timeFull: formatEatFull(n.createdAt),
      at: n.createdAt,
      unread: !n.read,
      to: linkFor(n),
    })
  }
  return groups.filter((g) => g.rows.length > 0)
}

/** S14 Notifications (design/S14-notifications). Route /seller/notifications. */
export function useNotificationsPage() {
  const online = useOnline()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const all = useNotifications(false)
  const unread = useNotifications(true)
  const shown = filter === 'all' ? all : unread
  const markRead = useMarkRead()
  const markAll = useMarkAllRead()
  const items = shown.data?.pages.flat() ?? []
  const unreadItems = unread.data?.pages.flat().length

  return {
    filter,
    setFilter,
    segments: [
      { value: 'all' as const, label: 'All' },
      { value: 'unread' as const, label: 'Unread', count: unreadItems },
    ],
    groups: groupByDay(items),
    state: shown.data
      ? items.length === 0
        ? ('empty' as const)
        : ('ready' as const)
      : shown.isPending
        ? ('loading' as const)
        : ('error' as const),
    retry: () => void shown.refetch(),
    hasMore: Boolean(shown.hasNextPage),
    loadingMore: shown.isFetchingNextPage,
    loadMore: () => void shown.fetchNextPage(),
    online,
    staleSince: !online && shown.data ? formatEat(new Date(shown.dataUpdatedAt).toISOString()) : null,
    canMarkAll: online && (unreadItems ?? 0) > 0 && !markAll.isPending,
    markAll: async () => {
      try {
        await markAll.mutateAsync()
        toast.show('All caught up', 'success')
      } catch {
        toast.show("Couldn't mark them as read. Try again.", 'danger')
      }
    },
    /** Called as the row's link is followed. */
    opened: (row: NotificationRow) => {
      if (row.unread) markRead.mutate(row.id)
    },
  }
}
