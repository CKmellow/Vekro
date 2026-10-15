import type { ReactNode } from 'react'
import { Link } from 'react-router'

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
  illustration?: ReactNode
}

/** Shared full-page message: 404, no permission, error, loading. The X2 design replaces the visuals. */
export function StatusPage({ title, body, primary, secondary, illustration }: StatusPageProps) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-5 text-center">
      {illustration}
      <h1 className="type-headline text-text">{title}</h1>
      <p className="type-body-md max-w-sm text-text-muted">{body}</p>
      <div className="flex flex-wrap justify-center gap-3">
        {primary && <ActionButton action={primary} primary />}
        {secondary && <ActionButton action={secondary} />}
      </div>
    </main>
  )
}

function ActionButton({ action, primary = false }: { action: Action; primary?: boolean }) {
  const className = primary
    ? 'type-title rounded-md bg-primary px-6 py-3 text-on-primary hover:bg-primary-hover'
    : 'type-title rounded-md border border-border bg-surface px-6 py-3 text-text'
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
