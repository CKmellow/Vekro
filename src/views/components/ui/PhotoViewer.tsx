import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'

/** Full-screen photo with pinch zoom. Escape or the close button ends it; focus returns to the opener. */
export function PhotoViewer({
  photos,
  index,
  title,
  onClose,
}: {
  photos: string[]
  /** The open photo, or null when closed. */
  index: number | null
  title: string
  onClose: () => void
}) {
  return (
    <Dialog.Root open={index !== null} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-ink-950/95" />
        <Dialog.Content
          aria-describedby={undefined}
          className="fixed inset-0 z-50 flex items-center justify-center focus:outline-none"
        >
          <Dialog.Title className="sr-only">{title}</Dialog.Title>
          {index !== null && (
            <img
              src={photos[index]}
              alt={`${title} (${index + 1} of ${photos.length})`}
              className="max-h-dvh max-w-full touch-pinch-zoom object-contain"
            />
          )}
          <Dialog.Close
            aria-label="Close photo"
            className="absolute top-[max(12px,env(safe-area-inset-top))] right-3 grid size-12 place-items-center rounded-full bg-ink-950/60 text-sand-0 focus-visible:ring-4 focus-visible:ring-emerald-400 focus-visible:outline-none"
          >
            <X aria-hidden="true" className="size-6" />
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
