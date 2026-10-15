import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { VekroMark } from '@/views/components/ui/VekroMark'
import { cn } from '@/lib/cn'

interface Action {
  label: string
  to?: string
  onClick?: () => void
}

interface StatusPageProps {
  title: string
  body: string
  primary?: Action
  secondary?: Action
  /** Large mark above the title: a status code ("404") or an icon tile. */
  illustration?: ReactNode
  /** Small label above the title, e.g. the name of the page that isn't ready. */
  eyebrow?: string
  /** Browser tab title; defaults to the page title. */
  documentTitle?: string
  /**
   * Full page (own <main>, brand mark, full height) for routes outside a layout.
   * Inside a layout the layout already provides <main> and the brand.
   */
  fullPage?: boolean
}

/** Shared full-page message: 404, not ready, no permission, error. The X2 design replaces the visuals. */
export function StatusPage({
  title,
  body,
  primary,
  secondary,
  illustration,
  eyebrow,
  documentTitle,
  fullPage = true,
}: StatusPageProps) {
  const Root = fullPage ? 'main' : 'section'
  return (
    <Root
      aria-labelledby="status-title"
      className={cn(
        'flex flex-col items-center justify-center gap-4 px-5 text-center',
        fullPage ? 'min-h-dvh bg-background py-10' : 'min-h-[60dvh] py-8',
      )}
    >
      <title>{`${documentTitle ?? title} · Vekro`}</title>
      {fullPage && (
        <Link to="/" aria-label="Vekro home" className="mb-6 rounded-md text-text">
          <VekroMark />
        </Link>
      )}
      {illustration}
      {eyebrow && <p className="type-label text-text-muted">{eyebrow}</p>}
      <h1 id="status-title" className="type-headline max-w-md text-balance text-text">
        {title}
      </h1>
      <p className="type-body-md max-w-sm text-pretty text-text-muted">{body}</p>
      {(primary || secondary) && (
        <div className="mt-2 flex w-full max-w-sm flex-col gap-3 sm:w-auto sm:max-w-none sm:flex-row sm:justify-center">
          {primary && <ActionButton action={primary} primary />}
          {secondary && <ActionButton action={secondary} />}
        </div>
      )}
    </Root>
  )
}

function ActionButton({ action, primary = false }: { action: Action; primary?: boolean }) {
  const className = cn(
    'type-title inline-flex h-13 items-center justify-center rounded-md px-6',
    'transition-colors duration-(--duration-tap) ease-standard',
    primary
      ? 'bg-primary text-on-primary shadow-highlight hover:bg-primary-hover'
      : 'border border-border bg-surface text-text hover:bg-sand-100',
  )
  if (action.to)
    return (
      <Link to={action.to} className={className}>
        {action.label}
      </Link>
    )
  return (
    <button type="button" onClick={action.onClick} className={className}>
      {action.label}
    </button>
  )
}
