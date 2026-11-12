import type { NeedKind } from '@/models/api/buyer'

/** B10 copy and action per "needs you" kind (design/B10-buyer-home). */
export const NEED_COPY: Record<
  NeedKind,
  { title: string; action: string; countdown?: string; path: (orderId: string) => string }
> = {
  pay: { title: 'Finish paying', action: 'Pay now', path: (id) => `/order/${id}/payment` },
  at_door: {
    title: 'Your item is at the door',
    action: 'Inspect',
    countdown: 'left to inspect',
    path: (id) => `/order/${id}/inspect`,
  },
  hold_check: {
    title: '24-hour check',
    action: 'Open',
    countdown: 'to report a problem',
    path: (id) => `/order/${id}`,
  },
  send_return: {
    title: 'Send the item back',
    action: 'Return steps',
    countdown: 'left to send it back',
    path: (id) => `/order/${id}/return`,
  },
  confirm_return: { title: 'Confirm the return', action: 'Answer', path: (id) => `/order/${id}` },
}
