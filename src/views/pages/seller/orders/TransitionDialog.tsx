import { ConfirmDialog } from '../../../components/ui/ConfirmDialog'

export interface TransitionDialogProps {
  pending: { reference: string; transition: 'dispatch' | 'mark_arrived' } | null
  running: boolean
  onConfirm: () => void
  onCancel: () => void
}

const COPY = {
  dispatch: (reference: string) => ({
    title: `Mark ${reference} as dispatched?`,
    body: "Only confirm once the courier has the item. The buyer is told it's on the way.",
    confirmLabel: "Yes, it's dispatched",
  }),
  mark_arrived: () => ({
    title: "Is the courier at the buyer's door?",
    body: 'The buyer gets a text to inspect the item and about 1 hour to decide.',
    confirmLabel: 'Yes, mark arrived',
  }),
}

/** Dispatch and arrival confirmations (design/S6-order-detail, Dialogs). Focus starts on "Not yet". */
export function TransitionDialog({ pending, running, onConfirm, onCancel }: TransitionDialogProps) {
  const copy = pending ? COPY[pending.transition](pending.reference) : COPY.dispatch('')
  return (
    <ConfirmDialog
      open={pending !== null}
      onOpenChange={(open) => !open && onCancel()}
      title={copy.title}
      body={copy.body}
      confirmLabel={copy.confirmLabel}
      cancelLabel="Not yet"
      onConfirm={onConfirm}
      loading={running}
    />
  )
}
