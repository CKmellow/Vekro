import * as AlertDialog from '@radix-ui/react-alert-dialog'
import { TriangleAlert } from 'lucide-react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { duration, spring } from '@/lib/motion'
import { Button } from './Button'

export interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Restate the amount and outcome: "Refund KES 52,000 to the buyer?" */
  title: string
  body: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  /** Irreversible actions are coral. */
  destructive?: boolean
  loading?: boolean
}

/**
 * Confirmation for serious actions. Focus is trapped and starts on the safe choice, never the destructive one.
 * The dialog stays open while `loading`; the caller closes it when the action settles.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  body,
  confirmLabel,
  cancelLabel = 'Cancel',
  onConfirm,
  destructive = false,
  loading = false,
}: ConfirmDialogProps) {
  const reduce = useReducedMotion()
  return (
    <AlertDialog.Root open={open} onOpenChange={(next) => !loading && onOpenChange(next)}>
      <AnimatePresence>
        {open && (
          <AlertDialog.Portal forceMount>
            <AlertDialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : duration.state }}
              />
            </AlertDialog.Overlay>
            <div className="fixed inset-0 z-50 grid place-items-center p-4">
              <AlertDialog.Content asChild forceMount>
                <motion.div
                  className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-surface p-6 shadow-3 focus:outline-none"
                  initial={reduce ? false : { y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={reduce ? { opacity: 0 } : { y: 24, opacity: 0 }}
                  transition={reduce ? { duration: 0 } : spring}
                >
                  <div className="flex items-start gap-3">
                    {destructive && (
                      <TriangleAlert aria-hidden="true" className="mt-0.5 size-6 shrink-0 text-coral-600" />
                    )}
                    <AlertDialog.Title className="type-title text-text">{title}</AlertDialog.Title>
                  </div>
                  <AlertDialog.Description className="type-body-md text-ink-600">
                    {body}
                  </AlertDialog.Description>
                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                    <AlertDialog.Cancel asChild>
                      <Button variant="ghost" disabled={loading}>
                        {cancelLabel}
                      </Button>
                    </AlertDialog.Cancel>
                    <Button
                      variant={destructive ? 'destructive' : 'primary'}
                      loading={loading}
                      onClick={onConfirm}
                    >
                      {confirmLabel}
                    </Button>
                  </div>
                </motion.div>
              </AlertDialog.Content>
            </div>
          </AlertDialog.Portal>
        )}
      </AnimatePresence>
    </AlertDialog.Root>
  )
}
