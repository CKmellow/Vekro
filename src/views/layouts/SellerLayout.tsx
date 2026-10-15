import {
  BarChart3,
  Bell,
  House,
  LayoutGrid,
  Menu,
  Package,
  Plus,
  RotateCcw,
  Search,
  Settings,
  ShoppingBag,
  type LucideIcon,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, NavLink } from 'react-router'
import { cn } from '@/lib/cn'
import { Sheet } from '../components/ui/Sheet'
import { VekroMark } from '../components/ui/VekroMark'

export interface SellerLayoutProps {
  /** Shown in the greeting and the profile row. */
  name: string
  /** "Verified seller" or similar, under the name. */
  subtitle?: string
  /** Badge counts; omit while unknown. */
  ordersNeedingAction?: number
  openReturns?: number
  hasUnreadNotifications?: boolean
  onSearch?: (query: string) => void
  children: ReactNode
}

interface Item {
  to: string
  label: string
  Icon: LucideIcon
  badge?: number
  end?: boolean
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('')

function Badge({ count, label }: { count?: number; label: string }) {
  if (!count) return null
  return (
    <span className="ml-auto rounded-full bg-saffron-500 px-1.5 font-mono text-label leading-5 font-bold text-ink-950">
      {count}
      <span className="sr-only"> {label}</span>
    </span>
  )
}

/** Seller pages: bottom navigation on phones; from 1024px a 264px emerald sidebar and a 72px top bar. */
export function SellerLayout({
  name,
  subtitle,
  ordersNeedingAction,
  openReturns,
  hasUnreadNotifications,
  onSearch,
  children,
}: SellerLayoutProps) {
  const [moreOpen, setMoreOpen] = useState(false)
  const items: Item[] = [
    { to: '/seller', label: 'Dashboard', Icon: LayoutGrid, end: true },
    { to: '/seller/orders', label: 'Orders', Icon: ShoppingBag, badge: ordersNeedingAction },
    { to: '/seller/listings', label: 'Listings', Icon: Package },
    { to: '/seller/returns', label: 'Returns', Icon: RotateCcw, badge: openReturns },
    { to: '/seller/analytics', label: 'Analytics', Icon: BarChart3 },
    { to: '/seller/notifications', label: 'Notifications', Icon: Bell },
    { to: '/seller/settings', label: 'Settings', Icon: Settings },
  ]
  const bell = (
    <Link
      to="/seller/notifications"
      className="relative grid size-11 place-items-center rounded-full text-ink-600 hover:bg-sand-100"
    >
      <Bell aria-hidden="true" className="size-5" />
      <span className="sr-only">Notifications{hasUnreadNotifications ? ', unread' : ''}</span>
      {hasUnreadNotifications && (
        <span aria-hidden="true" className="absolute top-2.5 right-2.5 size-2 rounded-full bg-coral-500" />
      )}
    </Link>
  )

  return (
    <div className="min-h-dvh lg:pl-66">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-66 flex-col gap-6 bg-emerald-950 p-4 text-sand-0 lg:flex">
        <VekroMark className="px-2 pt-2" />
        <nav aria-label="Seller" className="flex flex-col gap-1">
          {items.map(({ to, label, Icon, badge, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'type-body-md flex min-h-11 items-center gap-3 rounded-sm px-3 font-semibold transition-colors',
                  isActive ? 'bg-emerald-700 text-sand-0' : 'text-emerald-100 hover:bg-emerald-900',
                )
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
              <Badge count={badge} label="need action" />
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-4">
          <Link
            to="/seller/listings/new"
            className="type-body-md flex min-h-11 items-center justify-center gap-2 rounded-md bg-emerald-glow font-semibold text-emerald-950"
          >
            <Plus aria-hidden="true" className="size-5" />
            Create listing
          </Link>
          <div className="flex items-center gap-3 border-t border-emerald-800 px-2 pt-4">
            <span className="grid size-9 place-items-center rounded-full bg-emerald-800 text-body-sm font-bold">
              {initials(name)}
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="type-body-sm truncate font-semibold">{name}</span>
              {subtitle && <span className="type-body-sm truncate text-emerald-100">{subtitle}</span>}
            </span>
          </div>
        </div>
      </aside>

      {/* Top bar: greeting on phones, search on desktop */}
      <header className="sticky top-0 z-30 border-b border-border bg-surface/85 backdrop-blur-lg">
        <div className="mx-auto flex h-14 max-w-300 items-center gap-4 px-5 lg:h-18 lg:px-6">
          <p className="type-title flex-1 truncate lg:hidden">Habari, {name.split(' ')[0]}</p>
          <form
            role="search"
            className="hidden flex-1 lg:block"
            onSubmit={(e) => {
              e.preventDefault()
              onSearch?.(String(new FormData(e.currentTarget).get('q') ?? ''))
            }}
          >
            <label className="flex h-11 max-w-md items-center gap-2 rounded-md border border-border bg-surface-sunken px-3 focus-within:border-emerald-500">
              <Search aria-hidden="true" className="size-4 text-ink-400" />
              <span className="sr-only">Search orders</span>
              <input
                name="q"
                type="search"
                placeholder="Order ID or item"
                className="type-body-md min-w-0 flex-1 bg-transparent placeholder:text-ink-400 focus:outline-none"
              />
            </label>
          </form>
          {bell}
        </div>
      </header>

      <main className="mx-auto max-w-300 px-5 pt-5 pb-28 lg:px-6 lg:pb-10">{children}</main>

      {/* Phone bottom navigation */}
      <nav
        aria-label="Seller"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/85 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      >
        <ul className="grid h-16 grid-cols-5 items-center">
          {[items[0], items[1]].map((item) => item && <BottomItem key={item.to} item={item} />)}
          <li className="grid place-items-center">
            <Link
              to="/seller/listings/new"
              className="-mt-6 grid size-14 place-items-center rounded-full bg-primary text-on-primary shadow-1"
            >
              <Plus aria-hidden="true" className="size-6" />
              <span className="sr-only">New listing</span>
            </Link>
          </li>
          {items[3] && <BottomItem item={items[3]} />}
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
        <ul className="flex flex-col">
          {[items[2], ...items.slice(4)].map(
            (item) =>
              item && (
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
              ),
          )}
        </ul>
      </Sheet>
    </div>
  )
}

function BottomItem({ item }: { item: Item }) {
  const Icon = item.to === '/seller' ? House : item.Icon
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
        <Icon aria-hidden="true" className="size-5" />
        <span className="text-label font-semibold">{item.to === '/seller' ? 'Home' : item.label}</span>
        {item.badge ? (
          <span className="absolute -top-0.5 right-0 rounded-full bg-saffron-500 px-1 font-mono text-label leading-4 font-bold text-ink-950">
            {item.badge}
            <span className="sr-only"> need action</span>
          </span>
        ) : null}
      </NavLink>
    </li>
  )
}
