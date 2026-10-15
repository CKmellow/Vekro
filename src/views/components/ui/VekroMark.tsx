import { cn } from '@/lib/cn'

/** Emerald rounded square with a white "V" of two strokes, plus the wordmark. */
export function VekroMark({ wordmark = true, className }: { wordmark?: boolean; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2', className)}>
      <svg viewBox="0 0 32 32" className="size-8 shrink-0" aria-hidden="true">
        <rect width="32" height="32" rx="8" className="fill-primary" />
        <path
          d="M9 10l7 13 7-13"
          fill="none"
          strokeWidth="3.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-sand-0"
        />
      </svg>
      {wordmark ? (
        <span className="font-display text-title leading-none font-extrabold tracking-tight">Vekro</span>
      ) : (
        <span className="sr-only">Vekro</span>
      )}
    </span>
  )
}
