/** Shared status vocabulary: models fill it in (STATE_META), views render it. */
export type Tone = 'sand' | 'saffron' | 'emerald' | 'lake' | 'coral' | 'plum'

export type StatusIcon =
  | 'tag'
  | 'clock'
  | 'lock'
  | 'truck'
  | 'eye'
  | 'hourglass'
  | 'check'
  | 'undo'
  | 'coin'
  | 'alert'
  | 'box'
  | 'wrench'
  | 'question'
  | 'shield'
  | 'scale'

/** The Lock Ring on the vault card (DESIGN.md, Vault Card). */
export type LockRingState =
  | 'open' // dashed, awaiting payment
  | 'locked' // closed, breathing glow
  | 'pulse' // amber pulse: at the door, or waiting on the buyer
  | 'draining' // amber ring draining: 24-hour hold
  | 'releasing' // ring fills and the lock opens
  | 'released' // green check
  | 'refunded' // green return arrow
  | 'returned' // coral return arrow
  | 'coral' // issue reported
  | 'lake' // item moving on a return or repair
  | 'plum' // with Vekro support

export interface StatusView {
  label: string
  tone: Tone
  icon: StatusIcon
}
