import type { Order, OrderDeadlines } from './order'
import type { TransactionStatus } from './stateMeta'

export type DeadlineKind = 'dispatch' | 'inspect' | 'hold' | 'return_send' | 'return_confirm'

export interface Deadline {
  kind: DeadlineKind
  /** Server time (ISO). */
  at: string
  /** Full window, for the share drawn on a countdown ring. */
  totalMs: number
  /** True when derived from `updatedAt` because the server sent no deadline. */
  approximate: boolean
}

/** The backend's timeout windows (app/services/deadlines.py). */
const WINDOWS: Partial<
  Record<TransactionStatus, { kind: DeadlineKind; field: keyof OrderDeadlines; ms: number }>
> = {
  locked: { kind: 'dispatch', field: 'dispatchBy', ms: 48 * 3_600_000 },
  at_door_pending_inspection: { kind: 'inspect', field: 'inspectBy', ms: 3_600_000 },
  hold_24h: { kind: 'hold', field: 'holdUntil', ms: 24 * 3_600_000 },
  disputed_functional: { kind: 'return_send', field: 'returnSendBy', ms: 3 * 86_400_000 },
  return_in_transit: { kind: 'return_confirm', field: 'returnConfirmBy', ms: 3 * 86_400_000 },
}

/**
 * The running deadline for the order's state, or null. The server's deadline wins; without it the time is
 * derived from `updatedAt` (when the state was entered) and marked approximate. Never the device clock.
 */
export function currentDeadline(order: Pick<Order, 'status' | 'deadlines' | 'updatedAt'>): Deadline | null {
  const window = WINDOWS[order.status]
  if (!window) return null
  const server = order.deadlines[window.field]
  if (server) return { kind: window.kind, at: server, totalMs: window.ms, approximate: false }
  const at = new Date(new Date(order.updatedAt).getTime() + window.ms).toISOString()
  return { kind: window.kind, at, totalMs: window.ms, approximate: true }
}

/** Milliseconds left on the server clock: device time plus the offset measured at fetch. */
export function msLeft(
  deadline: Pick<Deadline, 'at'>,
  serverOffsetMs: number,
  deviceNow = Date.now(),
): number {
  return Math.max(0, new Date(deadline.at).getTime() - (deviceNow + serverOffsetMs))
}
