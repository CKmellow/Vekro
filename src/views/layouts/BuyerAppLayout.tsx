import {
  Bell,
  House,
  LifeBuoy,
  LogOut,
  Menu,
  RotateCcw,
  ShoppingBag,
  Store,
  UserRound,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import type { Mode } from '@/lib/mode'
import { useTheme } from '@/controllers/useTheme'
import { SegmentedControl } from '../components/ui/SegmentedControl'
import { Sheet } from '../components/ui/Sheet'
import { ThemeSwitch } from '../components/ui/ThemeSwitch'
import { VekroMark } from '../components/ui/VekroMark'

export interface BuyerAppLayoutProps {
  name: string
  /** Badge counts; omit while unknown. */
  needsYou?: number
  openCases?: number
  hasUnreadNotifications?: boolean
  /** The account has a store (open or closed): show Buying | Selling instead of "Start selling". */
  hasStore: boolean
  onSwitchToSelling: () => void
  onSignOut: () => void
  children: ReactNode
}

interface Item {
  to: string
  label: string
  short: string
  Icon: LucideIcon
  badge?: number
  dot?: boolean
  end?: boolean
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

function Badge({ count, dot, label }: { count?: number; dot?: boolean; label: string }) {
  if (count)
    return (
      <span className="ml-auto rounded-full bg-saffron-500 px-1.5 font-mono text-label leading-5 font-bold text-ink-950">
        {count}
        <span className="sr-only"> {label}</span>
      </span>
    )
  if (dot)
    return (
      <span className="ml-auto size-2 rounded-full bg-coral-500">
        <span className="sr-only">{label}</span>
      </span>
    )
  return null
}

function ModeSwitch({ onSwitchToSelling }: { onSwitchToSelling: () => void }) {
  return (
    <SegmentedControl<Mode>
      label="Switch between buying and selling"
      segments={[
        { value: 'buying', label: 'Buying' },
        { value: 'selling', label: 'Selling' },
      ]}
      value="buying"
      onChange={(next) => next === 'selling' && onSwitchToSelling()}
    />
  )
}

/**
 * The buyer area (X4, design/X4-account-shell): the seller shell's anatomy for every member. Bottom
 * navigation on phones; from 1024px a 264px emerald sidebar.
 */
export function BuyerAppLayout({
  name,
  needsYou,
  openCases,
  hasUnreadNotifications,
  hasStore,
  onSwitchToSelling,
  onSignOut,
  children,
}: BuyerAppLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const theme = useTheme()
  const items: Item[] = [
    { to: '/buyer', label: 'Home', short: 'Home', Icon: House, badge: needsYou, end: true },
    { to: '/buyer/orders', label: 'Orders', short: 'Orders', Icon: ShoppingBag },
    {
      to: '/buyer/cases',
      label: 'Returns & disputes',
      short: 'Returns',
      Icon: RotateCcw,
      badge: openCases,
    },
    {
      to: '/buyer/notifications',
      label: 'Notifications',
      short: 'Alerts',
      Icon: Bell,
      dot: hasUnreadNotifications,
    },
    { to: '/buyer/profile', label: 'Profile & security', short: 'Profile', Icon: UserRound },
    { to: '/help', label: 'Help', short: 'Help', Icon: LifeBuoy },
  ]
  const startSelling = (onNavigate?: () => void, tone: 'vault' | 'plain' = 'plain') =>
    hasStore ? null : (
      <Link
        to="/buyer/start-selling"
        onClick={onNavigate}
        className={cn(
          'type-body-md flex min-h-11 items-center gap-3 rounded-sm px-3 font-semibold',
          tone === 'vault'
            ? 'justify-center rounded-md bg-emerald-glow text-emerald-950'
            : 'text-primary hover:bg-sand-100',
        )}
      >
        <Store aria-hidden="true" className="size-5" />
        Start selling
      </Link>
    )

  return (
    <div className="min-h-dvh lg:pl-66">
      {/* Desktop sidebar */}
      <aside
        aria-label="Buyer menu"
        className="fixed inset-y-0 left-0 hidden w-66 flex-col gap-6 bg-emerald-950 p-4 text-sand-0 lg:flex"
      >
        <VekroMark className="px-2 pt-2" />
        {hasStore && <ModeSwitch onSwitchToSelling={onSwitchToSelling} />}
        <nav aria-label="Buyer" className="flex flex-col gap-1">
          {items.map(({ to, label, Icon, badge, dot, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'type-body-md flex min-h-11 items-center gap-3 rounded-sm px-3 font-semibold transition-colors',
                  isActive ? 'bg-primary text-on-primary' : 'text-emerald-100 hover:bg-emerald-900',
                )
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
              <Badge count={badge} dot={dot} label={dot ? 'unread' : 'need you'} />
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          {startSelling(undefined, 'vault')}
          <ThemeSwitch
            tone="vault"
            value={theme.preference}
            onChange={theme.setPreference}
            className="self-start"
          />
          <div className="flex items-center gap-3 border-t border-emerald-800 px-2 pt-4">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-800 text-body-sm font-bold">
              {initials(name)}
            </span>
            <span className="type-body-sm min-w-0 flex-1 truncate font-semibold">{name}</span>
            <button
              type="button"
              onClick={onSignOut}
              className="grid size-11 place-items-center rounded-full text-emerald-100 hover:bg-emerald-900"
            >
              <LogOut aria-hidden="true" className="size-5" />
              <span className="sr-only">Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Phone header */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-lg lg:hidden">
        <div className="mx-auto flex h-14 max-w-300 items-center gap-4 px-5">
          <VekroMark />
          <p className="type-body-md flex-1 truncate text-right text-text-muted">
            Habari, {name.split(' ')[0]}
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-300 px-5 pt-5 pb-28 lg:px-6 lg:pt-8 lg:pb-10">{children}</main>

      {/* Phone bottom navigation */}
      <nav
        aria-label="Buyer"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        <ul className="grid h-16 grid-cols-5 items-center">
          {items.slice(0, 4).map((item) => (
            <BottomItem key={item.to} item={item} />
          ))}
          <li className="grid place-items-center">
            <button
              type="button"
              onClick={() => setMoreOpen(true)}
              className="flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5 text-ink-600"
            >
              <Menu aria-hidden="true" className="size-5" />
              <span className="text-label font-semibold">More</span>
            </button>
          </li>
        </ul>
      </nav>
      <Sheet open={moreOpen} onOpenChange={setMoreOpen} title="More">
        {hasStore && (
          <div className="mb-3">
            <ModeSwitch
              onSwitchToSelling={() => {
                setMoreOpen(false)
                onSwitchToSelling()
              }}
            />
          </div>
        )}
        <ul className="flex flex-col">
          {items.slice(4).map((item) => (
            <li key={item.to}>
              <Link
                to={item.to}
                onClick={() => setMoreOpen(false)}
                className="type-body-lg flex min-h-12 items-center gap-3 rounded-sm px-2 hover:bg-sand-100"
              >
                <item.Icon aria-hidden="true" className="size-5 text-ink-600" />
                {item.label}
              </Link>
            </li>
          ))}
          <li>{startSelling(() => setMoreOpen(false))}</li>
          <li>
            <button
              type="button"
              onClick={() => {
                setMoreOpen(false)
                onSignOut()
              }}
              className="type-body-lg flex min-h-12 w-full items-center gap-3 rounded-sm px-2 text-left hover:bg-sand-100"
            >
              <LogOut aria-hidden="true" className="size-5 text-ink-600" />
              Sign out
            </button>
          </li>
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-border px-2 pt-4">
          <span className="type-body-md text-ink-600">Theme</span>
          <ThemeSwitch value={theme.preference} onChange={theme.setPreference} />
        </div>
      </Sheet>
    </div>
  )
}

function BottomItem({ item }: { item: Item }) {
  return (
    <li className="grid place-items-center">
      <NavLink
        to={item.to}
        end={item.end}
        className={({ isActive }) =>
          cn(
            'relative flex min-h-12 min-w-12 flex-col items-center justify-center gap-0.5',
            isActive ? 'text-primary' : 'text-ink-600',
          )
        }
      >
        <item.Icon aria-hidden="true" className="size-5" />
        <span className="text-label font-semibold">{item.short}</span>
        {item.badge ? (
          <span className="absolute -top-0.5 right-0 rounded-full bg-saffron-500 px-1 font-mono text-label leading-4 font-bold text-ink-950">
            {item.badge}
            <span className="sr-only"> need you</span>
          </span>
        ) : item.dot ? (
          <span className="absolute top-1 right-2 size-2 rounded-full bg-coral-500">
            <span className="sr-only">unread</span>
          </span>
        ) : null}
      </NavLink>
    </li>
  )
}
