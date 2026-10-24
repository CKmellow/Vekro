import type { components } from '@/models/api/schema'

export type NotificationEvent = components['schemas']['NotificationEventType']

/** An in-app notification about one order. The payload is never read here (buyer ones can hold the code). */
export interface AppNotification {
  id: string
  orderId: string
  /** The order's human reference (VK-7K3P9Q), never the id. */
  reference: string | null
  event: NotificationEvent
  title: string
  message: string
  read: boolean
  createdAt: string
}
