import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Pressable cards scale to 0.98 on press. */
  interactive?: boolean
  padded?: boolean
}

/** White surface floating on sand: 20px radius, level-1 shadow. */
export function Card({ interactive = false, padded = true, className, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-surface shadow-1',
        padded && 'p-5',
        interactive &&
          'cursor-pointer transition-transform duration-(--duration-tap) ease-standard active:scale-[0.98]',
        className,
      )}
      {...rest}
    />
  )
}
