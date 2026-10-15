import { cn } from '@/lib/cn'

/** A warm sand block that shimmers. Size it to match the content it stands in for. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        'animate-shimmer rounded-sm bg-[length:200%_100%]',
        'bg-linear-to-r from-sand-100 via-sand-200 to-sand-100',
        className,
      )}
    />
  )
}

/** Wraps skeleton blocks so screen readers hear one "Loading" instead of nothing. */
export function SkeletonGroup({
  label = 'Loading',
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className="flex flex-col gap-3">
      {children}
    </div>
  )
}
