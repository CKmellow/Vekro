import type { AppNotification } from '@/models/domain/notification'
import { api, type Schemas } from './client'

export const NOTIFICATION_PAGE = 50

const toNotification = (raw: Schemas['NotificationResponse']): AppNotification => ({
  id: raw.id,
  orderId: raw.transaction_id,
  event: raw.event_type,
  title: raw.title,
  message: raw.message,
  read: raw.is_read,
  createdAt: raw.created_at,
})

/** GET /notifications: in-app only (SMS copies of the same events are not repeated), newest first. */
export async function listNotifications(
  options: { unread?: boolean; offset?: number } = {},
  signal?: AbortSignal,
): Promise<AppNotification[]> {
  const raw = await api.get('/notifications', {
    query: {
      channel: 'in_app',
      unread: options.unread || undefined,
      limit: NOTIFICATION_PAGE,
      offset: options.offset || undefined,
    },
    signal,
  })
  return raw.map(toNotification)
}

export async function unreadCount(signal?: AbortSignal): Promise<number> {
  return (await api.get('/notifications/unread-count', { signal })).unread_count
}

export async function markNotificationRead(id: string): Promise<void> {
  await api.post('/notifications/{notification_id}/read', { path: { notification_id: id } })
}

export async function markAllNotificationsRead(): Promise<void> {
  await api.post('/notifications/read-all', {})
}
