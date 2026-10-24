import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_PAGE,
  unreadCount,
} from '@/models/api/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unread: boolean) => ['notifications', 'list', unread] as const,
  unread: ['notifications', 'unread'] as const,
}

/** Pages of 50, newest first; "Load more" asks for the next page. */
export const useNotifications = (unread: boolean) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(unread),
    queryFn: ({ pageParam, signal }) => listNotifications({ unread, offset: pageParam }, signal),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.length === NOTIFICATION_PAGE ? pages.length * NOTIFICATION_PAGE : undefined,
  })

/** The bell dot. Polls gently while the tab is visible. */
export const useUnreadCount = (options: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: notificationKeys.unread,
    queryFn: ({ signal }) => unreadCount(signal),
    enabled: options.enabled ?? true,
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  })

function useNotificationWrite<V>(run: (variables: V) => Promise<void>) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: run,
    onSettled: () => client.invalidateQueries({ queryKey: notificationKeys.all }),
  })
}

export const useMarkRead = () => useNotificationWrite((id: string) => markNotificationRead(id))
export const useMarkAllRead = () => useNotificationWrite(() => markAllNotificationsRead())
