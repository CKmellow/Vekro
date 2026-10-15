import { useState } from 'react'
import { STATE_META, statusView, type TransactionStatus } from '@/models/domain/stateMeta'
import { usePhotoPicker } from './usePhotoPicker'

const shown = (Object.keys(STATE_META) as TransactionStatus[]).filter(
  (s) => !STATE_META[s].legacy && s !== 'initiated',
)

const vaults: { status: TransactionStatus; amountLabel: string; hint: string }[] = [
  { status: 'awaiting_payment', amountLabel: 'Amount held', hint: 'Check your phone' },
  { status: 'locked', amountLabel: 'Amount held', hint: 'Held until you confirm' },
  { status: 'at_door_pending_inspection', amountLabel: 'Amount held', hint: 'Inspect before you confirm' },
  { status: 'hold_24h', amountLabel: 'Amount held', hint: 'Released after the check' },
  { status: 'released', amountLabel: 'Amount released', hint: 'M-Pesa ref QK92XY7A1' },
  { status: 'refunded_buyer', amountLabel: 'Amount returned', hint: 'Back to the buyer' },
]

/** Sample data for the dev-only component gallery (/dev/ui). */
export function useUiGallery() {
  const photos = usePhotoPicker()
  const [deadlineBase] = useState(() => Date.now())
  const inFuture = (ms: number) => new Date(deadlineBase + ms).toISOString()
  return {
    statuses: shown.map((s) => ({ key: s, buyer: statusView(s, 'buyer'), seller: statusView(s, 'seller') })),
    vaults: vaults.map((v) => ({
      ...v,
      view: statusView(v.status, 'buyer'),
      ring: STATE_META[v.status].ring,
    })),
    tableStatus: {
      locked: statusView('locked', 'seller'),
      onTheWay: statusView('out_for_delivery', 'seller'),
      hold: statusView('hold_24h', 'seller'),
    },
    deadlines: {
      dispatch: inFuture(41 * 3_600_000 + 12 * 60_000),
      hold: inFuture(21 * 3_600_000 + 4 * 60_000),
      door: inFuture(5 * 60_000 + 40_000),
    },
    photos,
  }
}
