import * as Dialog from '@radix-ui/react-dialog'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'
import { duration, spring } from '@/lib/motion'

export interface SheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: ReactNode
  /** Actions pinned under the content. */
  footer?: ReactNode
}

/** Bottom sheet: grab handle, 28px top radius, spring slide-up over a scrim. Traps focus; Escape closes. */
export function Sheet({ open, onOpenChange, title, description, children, footer }: SheetProps) {
  const reduce = useReducedMotion()
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-40 bg-scrim"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: reduce ? 0 : duration.sheet }}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount {...(description ? {} : { 'aria-describedby': undefined })}>
              <motion.div
                className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[90dvh] w-full max-w-lg flex-col gap-4 rounded-t-xl bg-surface px-6 pt-3 pb-[max(24px,env(safe-area-inset-bottom))] shadow-3 focus:outline-none"
                initial={reduce ? false : { y: '100%' }}
                animate={{ y: 0 }}
                exit={reduce ? { opacity: 0 } : { y: '100%' }}
                transition={reduce ? { duration: 0 } : spring}
              >
                <span aria-hidden="true" className="mx-auto h-1 w-10 shrink-0 rounded-full bg-sand-300" />
                <div className="flex flex-col gap-1">
                  <Dialog.Title className="type-headline text-text">{title}</Dialog.Title>
                  {description && (
                    <Dialog.Description className="type-body-sm text-text-muted">
                      {description}
                    </Dialog.Description>
                  )}
                </div>
                <div className="-mx-1 overflow-y-auto px-1">{children}</div>
                {footer && <div className="flex flex-col gap-2 sm:flex-row-reverse">{footer}</div>}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
