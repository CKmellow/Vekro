import { ArrowLeftRight, Inbox, LogOut, Search, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink } from 'react-router'
import { cn } from '@/lib/cn'

export interface AdminLayoutProps {
  name: string
  /** Escalations waiting for a decision; omit while unknown. */
  queueCount?: number
  onSearch?: (query: string) => void
  onSignOut?: () => void
  children: ReactNode
}

const items: { to: string; label: string; Icon: LucideIcon; end?: boolean }[] = [
  { to: '/admin', label: 'Queue', Icon: Inbox, end: true },
  { to: '/admin/transactions', label: 'Transactions', Icon: ArrowLeftRight },
]

/** Support console: dark surfaces, 240px sidebar with a plum active indicator, 1280px design width. */
export function AdminLayout({ name, queueCount, onSearch, onSignOut, children }: AdminLayoutProps) {
  return (
    <div className="min-h-dvh bg-dark-background pl-60 text-dark-text [color-scheme:dark]">
      <aside className="fixed inset-y-0 left-0 flex w-60 flex-col gap-6 border-r border-dark-border bg-dark-surface p-4">
        <span className="flex items-center gap-2 px-2 pt-2">
          <span
            aria-hidden="true"
            className="grid size-8 place-items-center rounded-sm bg-plum-500 font-display font-extrabold text-sand-0"
          >
            V
          </span>
          <span className="type-title">Console</span>
        </span>
        <nav aria-label="Console" className="flex flex-col gap-1">
          {items.map(({ to, label, Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'type-body-md flex min-h-11 items-center gap-3 rounded-sm border-l-3 px-3 font-semibold transition-colors',
                  isActive
                    ? 'border-plum-500 bg-dark-surface-raised text-dark-text'
                    : 'border-transparent text-dark-text-muted hover:bg-dark-surface-raised',
                )
              }
            >
              <Icon aria-hidden="true" className="size-5" />
              {label}
              {to === '/admin' && queueCount !== undefined && (
                <span className="ml-auto rounded-full bg-plum-500 px-1.5 font-mono text-label leading-5 font-bold text-sand-0">
                  {queueCount}
                  <span className="sr-only"> waiting</span>
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 border-t border-dark-border pt-4">
          <span className="type-body-sm truncate px-3 text-dark-text-muted">{name}</span>
          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="type-body-md flex min-h-11 items-center gap-3 rounded-sm px-3 text-dark-text-muted hover:bg-dark-surface-raised"
            >
              <LogOut aria-hidden="true" className="size-5" />
              Sign out
            </button>
          )}
        </div>
      </aside>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-dark-border bg-dark-background/90 px-6 backdrop-blur-lg">
        <form
          role="search"
          className="flex-1"
          onSubmit={(e) => {
            e.preventDefault()
            onSearch?.(String(new FormData(e.currentTarget).get('q') ?? ''))
          }}
        >
          <label className="flex h-10 max-w-lg items-center gap-2 rounded-sm border border-dark-border bg-dark-surface px-3 focus-within:border-plum-500">
            <Search aria-hidden="true" className="size-4 text-dark-text-muted" />
            <span className="sr-only">Search transactions</span>
            <input
              name="q"
              type="search"
              placeholder="Reference, phone or listing"
              className="type-body-md min-w-0 flex-1 bg-transparent text-dark-text placeholder:text-dark-text-muted focus:outline-none"
            />
          </label>
        </form>
        {queueCount !== undefined && (
          <span className="type-body-sm rounded-full border border-plum-500/40 bg-plum-500/15 px-3 py-1 font-semibold text-dark-text">
            {queueCount} in queue
          </span>
        )}
      </header>
      <main className="px-6 py-6">{children}</main>
    </div>
  )
}
