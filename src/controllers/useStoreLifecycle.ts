import { useState } from 'react'
import { formatKes } from '@/lib/money'
import { formatEat } from '@/lib/time'
import { toast } from '@/lib/toast'
import { ApiError } from '@/models/api/errors'
import { useCloseCheck, useCloseStore, useReopenStore } from '@/models/queries/store'
import { useSession } from './useSession'

export interface Blocker {
  label: string
  references: string[]
}

/** S16 Close store (design/S16-close-store), the "Your store" section of S13 Settings. */
export function useStoreLifecycle() {
  const session = useSession()
  const store = session.status === 'authenticated' ? session.user.store : null
  const [open, setOpen] = useState(false)
  const check = useCloseCheck(open)
  const close = useCloseStore()
  const reopen = useReopenStore()
  const c = check.data

  const blockers: Blocker[] = c
    ? [
        { label: 'Open orders', references: c.openOrders },
        { label: 'Payouts not yet settled', references: c.unsettledPayouts },
        { label: 'Open returns or disputes', references: c.openDisputes },
      ].filter((b) => b.references.length > 0)
    : []

  return {
    status: store?.status ?? 'none',
    closedSince: store?.closed_at ? formatEat(store.closed_at) : null,
    dialogOpen: open,
    setDialogOpen: setOpen,
    checkState: c ? (c.canClose ? ('can_close' as const) : ('blocked' as const)) : ('loading' as const),
    blockers,
    held: c && c.heldAmount > 0 ? `${formatKes(c.heldAmount)} still held for your orders` : null,
    closeStore: async () => {
      try {
        await close.mutateAsync()
        setOpen(false)
        toast.show('Your store is closed. Your history stays on record.', 'success')
      } catch (e) {
        if (e instanceof ApiError && e.kind === 'conflict') void check.refetch()
        else toast.show("We couldn't close your store. Try again.", 'danger')
      }
    },
    closing: close.isPending,
    reopenStore: async () => {
      try {
        await reopen.mutateAsync()
        toast.show('Your store is open again. Restore the listings you want from Listings.', 'success')
      } catch {
        toast.show("We couldn't reopen your store. Try again.", 'danger')
      }
    },
    reopening: reopen.isPending,
  }
}
