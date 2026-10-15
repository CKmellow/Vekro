import {
  CircleAlert,
  CircleCheck,
  CircleHelp,
  Clock,
  Coins,
  Eye,
  Hourglass,
  Lock,
  Package,
  Scale,
  ShieldCheck,
  Tag,
  Truck,
  Undo2,
  Wrench,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import type { StatusIcon, StatusView, Tone } from '@/lib/status'

const icons: Record<StatusIcon, LucideIcon> = {
  tag: Tag,
  clock: Clock,
  lock: Lock,
  truck: Truck,
  eye: Eye,
  hourglass: Hourglass,
  check: CircleCheck,
  undo: Undo2,
  coin: Coins,
  alert: CircleAlert,
  box: Package,
  wrench: Wrench,
  question: CircleHelp,
  shield: ShieldCheck,
  scale: Scale,
}

const pillTone: Record<Tone, string> = {
  sand: 'bg-sand-100 text-ink-600',
  saffron: 'bg-saffron-50 text-saffron-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  lake: 'bg-lake-50 text-lake-600',
  coral: 'bg-coral-50 text-coral-600',
  plum: 'bg-plum-50 text-plum-700',
}

/** Icon, label and tint together: status is never carried by colour alone. */
export function StatusPill({ status, className }: { status: StatusView; className?: string }) {
  const Icon = icons[status.icon]
  return (
    <span
      className={cn(
        'type-body-sm inline-flex h-7 max-w-full items-center gap-1.5 rounded-full px-2.5 whitespace-nowrap',
        pillTone[status.tone],
        className,
      )}
    >
      <Icon aria-hidden="true" className="size-3.5 shrink-0" strokeWidth={2.25} />
      <span className="min-w-0 truncate">{status.label}</span>
    </span>
  )
}
