import { ChevronDown, Mail, MessageCircle, Package, Phone, Search } from 'lucide-react'
import { Link } from 'react-router'
import { useHelp } from '@/controllers/useHelp'
import { cn } from '@/lib/cn'
import { PublicLayout } from '../../layouts/PublicLayout'

const CONTACT_ICON = { call: Phone, whatsapp: MessageCircle, email: Mail }

/** X3 Help and support (design/X3-help). Route /help. */
export function HelpPage() {
  const p = useHelp()

  return (
    <PublicLayout>
      <title>Help · Vekro</title>
      <div className="relative">
        <div aria-hidden="true" className="bg-mesh pointer-events-none absolute inset-x-0 top-0 h-60" />
        <div className="relative mx-auto flex max-w-160 flex-col gap-8 px-5 py-10 lg:py-14">
          <div className="flex flex-col gap-5">
            <h1 className="type-display-lg text-balance text-text">How can we help?</h1>
            <form role="search" onSubmit={(e) => e.preventDefault()}>
              <label className="flex h-14 items-center gap-3 rounded-md border border-border bg-surface px-4 shadow-1 transition-[border-color,box-shadow] duration-(--duration-state) focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100">
                <Search aria-hidden="true" className="size-5 text-text-muted" />
                <span className="sr-only">Search help</span>
                <input
                  type="search"
                  value={p.search}
                  onChange={(e) => p.setSearch(e.target.value)}
                  placeholder="Search help"
                  className="type-body-lg min-w-0 flex-1 bg-transparent text-text placeholder:text-ink-400 focus:outline-none"
                />
              </label>
            </form>
            <p role="status" aria-live="polite" className="sr-only">
              {p.resultsLabel}
            </p>
          </div>

          {p.noResults ? (
            <div className="flex flex-col items-center gap-3 rounded-lg bg-surface px-6 py-12 text-center shadow-1">
              <p className="type-title text-text">No answers match "{p.search.trim()}"</p>
              <p className="type-body-md text-text-muted">Try fewer words, or ask us below.</p>
              <button
                type="button"
                onClick={p.clearSearch}
                className="type-body-md min-h-11 rounded-md border border-border px-4 font-semibold text-text hover:bg-sand-100"
              >
                Clear search
              </button>
            </div>
          ) : (
            p.sections.map((section) => (
              <section
                key={section.title}
                aria-labelledby={`help-${section.title}`}
                className="flex flex-col gap-3"
              >
                <h2 id={`help-${section.title}`} className="type-label text-text-muted">
                  {section.title}
                </h2>
                <ul className="flex flex-col divide-y divide-border rounded-lg bg-surface shadow-1">
                  {section.items.map((item) => {
                    const open = p.searching || p.isOpen(section.title, item.id)
                    const panel = `help-answer-${item.id}`
                    return (
                      <li key={item.id}>
                        <h3>
                          {p.searching ? (
                            <span className="type-title flex min-h-14 items-center px-5 py-3 text-text">
                              {item.q}
                            </span>
                          ) : (
                            <button
                              type="button"
                              aria-expanded={open}
                              aria-controls={panel}
                              onClick={() => p.toggle(section.title, item.id)}
                              className="type-title flex min-h-14 w-full items-center justify-between gap-4 rounded-lg px-5 py-3 text-left text-text focus-visible:outline-2 focus-visible:outline-emerald-500"
                            >
                              {item.q}
                              <ChevronDown
                                aria-hidden="true"
                                className={cn(
                                  'size-5 shrink-0 text-text-muted transition-transform duration-(--duration-state) ease-standard',
                                  open && 'rotate-180',
                                )}
                              />
                            </button>
                          )}
                        </h3>
                        <div
                          id={panel}
                          inert={!open}
                          className={cn(
                            'grid transition-[grid-template-rows] duration-(--duration-state) ease-standard',
                            open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                          )}
                        >
                          <p className="type-body-md overflow-hidden px-5 text-pretty text-text-muted">
                            <span className="block pb-4">{item.a}</span>
                          </p>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))
          )}

          <section className="flex items-start gap-4 rounded-lg bg-surface p-5 shadow-1">
            <span
              aria-hidden="true"
              className="grid size-11 shrink-0 place-items-center rounded-md bg-emerald-50 text-primary"
            >
              <Package className="size-5" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="type-title text-text">Track your order</h2>
              <p className="type-body-md text-text-muted">
                Have an order link? Open it from your SMS. Signed in? See all your orders.
              </p>
              <Link to={p.ordersTo} className="type-body-md mt-1 font-semibold text-primary hover:underline">
                See all your orders
              </Link>
            </div>
          </section>

          <section
            aria-labelledby="help-contact"
            className="flex flex-col gap-4 rounded-lg bg-ink-950 p-6 text-sand-0"
          >
            <h2 id="help-contact" className="type-headline">
              Talk to Vekro support
            </h2>
            {p.contacts.length > 0 ? (
              <>
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                  {p.contacts.map((c) => {
                    const Icon = CONTACT_ICON[c.kind]
                    return (
                      <a
                        key={c.kind}
                        href={c.href}
                        {...(c.kind === 'whatsapp' && { target: '_blank', rel: 'noreferrer' })}
                        className="type-title inline-flex min-h-13 items-center justify-center gap-2 rounded-md bg-sand-0 px-5 text-text hover:bg-sand-100"
                      >
                        <Icon aria-hidden="true" className="size-5" />
                        {c.label}
                      </a>
                    )
                  })}
                </div>
                {p.hours && <p className="type-body-md text-sand-0/80">{p.hours}</p>}
              </>
            ) : (
              <p className="type-body-md text-sand-0/80">Reply to any Vekro SMS to reach support.</p>
            )}
          </section>

          {p.reportHref && (
            <a
              href={p.reportHref}
              className="type-body-sm self-center text-text-muted underline-offset-4 hover:underline"
            >
              Report a problem with this page
            </a>
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
