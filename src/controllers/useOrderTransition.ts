import { useState } from 'react'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { useSellerTransition, type SellerTransition } from '@/models/queries/orders'

export interface PendingTransition {
  orderId: string
  reference: string
  transition: SellerTransition
}

const DONE: Record<SellerTransition, string> = {
  dispatch: 'Marked as dispatched',
  mark_arrived: 'The buyer has been asked to inspect',
}

/**
 * The seller's dispatch and arrival confirmations (S5 quick actions, S6 action panel). `ask` opens the
 * dialog; `confirm` runs it. A 409 means the order moved on: the lists refetch and the seller is told.
 */
export function useOrderTransition() {
  const [pending, setPending] = useState<PendingTransition | null>(null)
  const mutation = useSellerTransition()

  return {
    pending,
    ask: setPending,
    cancel: () => {
      if (!mutation.isPending) setPending(null)
    },
    running: mutation.isPending,
    confirm: async () => {
      if (!pending) return
      try {
        await mutation.mutateAsync({ orderId: pending.orderId, transition: pending.transition })
        toast.show(DONE[pending.transition], 'success')
      } catch (error) {
        const conflict = error instanceof ApiError && error.kind === 'conflict'
        toast.show(
          conflict ? "This order changed. Here's the latest." : "That didn't go through. Try again.",
          conflict ? 'info' : 'danger',
        )
      } finally {
        setPending(null)
      }
    },
  }
}
