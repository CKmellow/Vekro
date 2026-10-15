import { useReducedMotion } from 'motion/react'
import { useEffect, useState } from 'react'
import { STATE_META, statusView, type TransactionStatus } from '@/models/domain/stateMeta'

interface Frame {
  status: TransactionStatus
  amountLabel: string
  hint: string
}
const FRAMES: [Frame, Frame] = [
  { status: 'locked', amountLabel: 'Amount held', hint: 'Held until the buyer accepts' },
  { status: 'released', amountLabel: 'Amount released', hint: 'Paid to your M-Pesa' },
]

/** The mini vault on the sign up and log in panels: cycles Locked and Released every 4s (static with reduced motion). */
export function useAuthShowcase() {
  const reduce = useReducedMotion()
  const [index, setIndex] = useState(0)
  useEffect(() => {
    if (reduce) return
    const id = window.setInterval(() => setIndex((i) => (i + 1) % FRAMES.length), 4000)
    return () => window.clearInterval(id)
  }, [reduce])
  const frame = (reduce ? undefined : FRAMES[index]) ?? FRAMES[0]
  return {
    reference: 'VK-7K3P9Q',
    amount: 52000,
    amountLabel: frame.amountLabel,
    hint: frame.hint,
    status: statusView(frame.status, 'seller'),
    ring: STATE_META[frame.status].ring,
  }
}
