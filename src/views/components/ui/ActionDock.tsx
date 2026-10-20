import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/**
 * Frosted action bar pinned to the bottom of buyer pages (B1 to B4), safe-area aware. The page column
 * keeps `pb-32` so nothing hides under it.
 */
export function ActionDock({
  children,
  note,
  className,
}: {
  children: ReactNode
  note?: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 backdrop-blur-lg',
        'pb-[max(12px,env(safe-area-inset-bottom))]',
        className,
      )}
    >
      <div className="mx-auto flex max-w-120 flex-col gap-2 px-5 pt-3">
        {children}
        {note && <p className="type-body-sm text-center text-text-muted">{note}</p>}
      </div>
    </div>
  )
}
