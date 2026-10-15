import { animate, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/cn'
import { formatKes } from '@/lib/money'
import { duration, ease } from '@/lib/motion'

export interface MoneyTextProps {
  amount: number | string
  /** Count up from zero over 700ms, once per mount. */
  countUp?: boolean
  className?: string
}

/** "KES 52,000". Screen readers always hear the final amount, never the counting. */
export function MoneyText({ amount, countUp = false, className }: MoneyTextProps) {
  const target = Number(amount)
  const reduce = useReducedMotion()
  const animated = countUp && !reduce
  const [shown, setShown] = useState(animated ? 0 : target)
  const counted = useRef(false)

  useEffect(() => {
    if (!animated || counted.current) {
      setShown(target)
      return
    }
    const controls = animate(0, target, {
      duration: duration.countUp,
      ease: [...ease],
      onUpdate: (v) => setShown(Math.round(v)),
      onComplete: () => {
        counted.current = true
      },
    })
    return () => controls.stop()
  }, [target, animated])

  return (
    <span className={cn('tabular-nums', className)}>
      <span className="sr-only">{formatKes(target)}</span>
      <span aria-hidden="true">{formatKes(shown)}</span>
    </span>
  )
}
