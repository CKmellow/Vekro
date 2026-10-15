import { CircleAlert, Info, ShieldCheck, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BannerTone = 'info' | 'warning' | 'danger' | 'escalation'

const tones: Record<BannerTone, { box: string; dot: string; title: string; Icon: typeof Info }> = {
  info: { box: 'bg-lake-50 border-lake-500/20', dot: 'bg-lake-500', title: 'text-ink-950', Icon: Info },
  warning: {
    box: 'bg-saffron-50 border-saffron-500/30',
    dot: 'bg-saffron-500',
    title: 'text-saffron-700',
    Icon: TriangleAlert,
  },
  danger: {
    box: 'bg-coral-50 border-coral-500/20',
    dot: 'bg-coral-500',
    title: 'text-coral-600',
    Icon: CircleAlert,
  },
  escalation: {
    box: 'bg-plum-50 border-plum-500/20',
    dot: 'bg-plum-500',
    title: 'text-plum-700',
    Icon: ShieldCheck,
  },
}

export interface BannerProps {
  tone: BannerTone
  title: string
  children?: ReactNode
  /** One optional action, such as "Try again". */
  action?: ReactNode
  className?: string
}

/** Inline tinted card for warnings, failures and escalations. Danger is announced right away. */
export function Banner({ tone, title, children, action, className }: BannerProps) {
  const { box, dot, title: titleTone, Icon } = tones[tone]
  return (
    <div
      role={tone === 'danger' ? 'alert' : 'status'}
      className={cn('flex flex-wrap items-start gap-3 rounded-md border p-4 sm:flex-nowrap', box, className)}
    >
      <span className={cn('grid size-6 shrink-0 place-items-center rounded-full text-sand-0', dot)}>
        <Icon aria-hidden="true" className="size-3.5" strokeWidth={2.5} />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className={cn('type-body-md font-semibold', titleTone)}>{title}</p>
        {children && <div className="type-body-sm text-ink-600">{children}</div>}
      </div>
      {action && <div className="w-full pl-9 sm:w-auto sm:shrink-0 sm:self-center sm:pl-0">{action}</div>}
    </div>
  )
}
