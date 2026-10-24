import type { components } from '@/models/api/schema'

export type NotificationEvent = components['schemas']['NotificationEventType']

/** An in-app notification about one order. The payload is never read here (buyer ones can hold the code). */
export interface AppNotification {
  id: string
  orderId: string
  event: NotificationEvent
  title: string
  message: string
  read: boolean
  createdAt: string
}
