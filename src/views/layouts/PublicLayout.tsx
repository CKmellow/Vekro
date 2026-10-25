import { Menu, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { cn } from '@/lib/cn'
import { VekroMark } from '../components/ui/VekroMark'

const NAV = [
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#for-sellers', label: 'For sellers' },
]

/** Public pages (X1, X3): frosted nav that gains a hairline on scroll, and a footer. */
export function PublicLayout({ children }: { children: ReactNode }) {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="min-h-dvh bg-background text-text">
      <header
        className={cn(
          'sticky top-0 z-30 border-b bg-surface/85 backdrop-blur-lg transition-colors duration-(--duration-state)',
          scrolled ? 'border-border' : 'border-transparent',
        )}
      >
        <div className="mx-auto flex h-16 max-w-300 items-center gap-6 px-5 lg:px-6">
          <Link to="/" aria-label="Vekro home">
            <VekroMark />
          </Link>
          <nav aria-label="Main" className="hidden flex-1 gap-6 md:flex">
            {NAV.map((n) => (
              <a
                key={n.href}
                href={n.href}
                className="type-body-md font-semibold text-ink-600 hover:text-text"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/login"
              className="type-body-md inline-flex min-h-11 items-center px-3 font-semibold text-ink-600 hover:text-text"
            >
              Log in
            </Link>
            <Link
              to="/register"
              className="type-body-md hidden min-h-11 items-center rounded-md bg-primary px-4 font-semibold text-on-primary shadow-highlight hover:bg-primary-hover sm:inline-flex"
            >
              Start selling
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-controls="public-menu"
              onClick={() => setOpen((o) => !o)}
              className="grid size-11 place-items-center rounded-md text-ink-600 hover:bg-sand-100 md:hidden"
            >
              {open ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </div>
        {open && (
          <nav id="public-menu" aria-label="Main" className="border-t border-border px-5 py-3 md:hidden">
            {[...NAV, { href: '/register', label: 'Start selling' }, { href: '/help', label: 'Help' }].map(
              (n) => (
                <a
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="type-body-lg flex min-h-12 items-center"
                >
                  {n.label}
                </a>
              ),
            )}
          </nav>
        )}
      </header>
      <main>{children}</main>
      <footer className="border-t border-border bg-surface">
        <div className="mx-auto flex max-w-300 flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between lg:px-6">
          <VekroMark />
          <nav aria-label="Footer" className="type-body-md flex flex-wrap gap-x-6 gap-y-2 text-ink-600">
            <Link to="/help" className="hover:text-text">
              Help
            </Link>
            <Link to="/login" className="hover:text-text">
              Log in
            </Link>
            <Link to="/register" className="hover:text-text">
              Start selling
            </Link>
            <Link to="/admin/login" className="type-body-sm hover:text-text">
              Support console
            </Link>
          </nav>
          <p className="type-body-sm text-text-muted">© 2026 Vekro</p>
        </div>
      </footer>
    </div>
  )
}
