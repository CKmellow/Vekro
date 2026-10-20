import { CircleCheck, Package, Plus, Smartphone, Unlink, Vault } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type EmptyIllustration = 'done' | 'link' | 'listing' | 'parcel' | 'phone' | 'vault'

const art: Record<EmptyIllustration, { Icon: typeof Vault; tone: string }> = {
  done: { Icon: CircleCheck, tone: 'bg-emerald-50 text-emerald-700' },
  link: { Icon: Unlink, tone: 'bg-sand-100 text-ink-600' },
  listing: { Icon: Plus, tone: 'bg-emerald-50 text-emerald-700' },
  parcel: { Icon: Package, tone: 'bg-sand-100 text-ink-600' },
  phone: { Icon: Smartphone, tone: 'bg-sand-100 text-ink-600' },
  vault: { Icon: Vault, tone: 'bg-emerald-50 text-emerald-700' },
}

export interface EmptyStateProps {
  illustration: EmptyIllustration
  title: string
  body: string
  /** One action: a Button or a link. */
  action?: ReactNode
  className?: string
}

/** Simple geometric illustration, one sentence and one action. */
export function EmptyState({ illustration, title, body, action, className }: EmptyStateProps) {
  const { Icon, tone } = art[illustration]
  return (
    <div className={cn('flex flex-col items-center gap-3 px-5 py-10 text-center', className)}>
      <span aria-hidden="true" className={cn('grid size-14 place-items-center rounded-md', tone)}>
        <Icon className="size-7" />
      </span>
      <h2 className="type-title text-text">{title}</h2>
      <p className="type-body-sm max-w-xs text-text-muted">{body}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
