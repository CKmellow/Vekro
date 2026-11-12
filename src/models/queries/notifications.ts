import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  NOTIFICATION_PAGE,
  unreadCount,
  type NotificationAudience,
} from '@/models/api/notifications'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: (unread: boolean, audience?: NotificationAudience) =>
    ['notifications', 'list', unread, audience ?? 'all'] as const,
  unread: (audience?: NotificationAudience) => ['notifications', 'unread', audience ?? 'all'] as const,
}

/** Pages of 50, newest first; "Load more" asks for the next page. */
export const useNotifications = (unread: boolean, audience?: NotificationAudience) =>
  useInfiniteQuery({
    queryKey: notificationKeys.list(unread, audience),
    queryFn: ({ pageParam, signal }) => listNotifications({ unread, offset: pageParam, audience }, signal),
    initialPageParam: 0,
    getNextPageParam: (last, pages) =>
      last.length === NOTIFICATION_PAGE ? pages.length * NOTIFICATION_PAGE : undefined,
  })

/** The bell dot. Polls gently while the tab is visible. */
export const useUnreadCount = (options: { enabled?: boolean; audience?: NotificationAudience } = {}) =>
  useQuery({
    queryKey: notificationKeys.unread(options.audience),
    queryFn: ({ signal }) => unreadCount(options.audience, signal),
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
