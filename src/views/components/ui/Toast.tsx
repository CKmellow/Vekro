import * as RadixToast from '@radix-ui/react-toast'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import { m, useReducedMotion } from 'motion/react'
import { useSyncExternalStore } from 'react'
import { cn } from '@/lib/cn'
import { spring } from '@/lib/motion'
import { toast, type ToastTone } from '@/lib/toast'

const icons: Record<ToastTone, typeof Info> = { success: CircleCheck, info: Info, danger: CircleAlert }
const iconTone: Record<ToastTone, string> = {
  success: 'text-emerald-400',
  info: 'text-lake-500',
  danger: 'text-coral-500',
}

/** Top-anchored pill toasts, 4s auto-dismiss. Mount once, in the app providers. */
export function Toaster() {
  const toasts = useSyncExternalStore(toast.subscribe, toast.current, toast.current)
  const reduce = useReducedMotion()
  return (
    <RadixToast.Provider duration={4000} swipeDirection="up" label="Notifications">
      {toasts.map(({ id, tone, message }) => {
        const Icon = icons[tone]
        return (
          <RadixToast.Root
            key={id}
            type={tone === 'danger' ? 'foreground' : 'background'}
            onOpenChange={(open) => !open && toast.dismiss(id)}
            asChild
          >
            <m.li
              initial={reduce ? false : { y: -24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={spring}
              className="type-body-md flex items-center gap-2 rounded-full bg-ink-950 py-2.5 pr-5 pl-4 text-sand-0 shadow-1"
            >
              <Icon aria-hidden="true" className={cn('size-4 shrink-0', iconTone[tone])} />
              <RadixToast.Description>{message}</RadixToast.Description>
            </m.li>
          </RadixToast.Root>
        )
      })}
      <RadixToast.Viewport className="fixed inset-x-0 top-4 z-50 mx-auto flex w-fit max-w-[calc(100vw-32px)] flex-col items-center gap-2 outline-none" />
    </RadixToast.Provider>
  )
}
