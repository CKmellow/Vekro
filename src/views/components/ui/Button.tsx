import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'

const variants: Record<ButtonVariant, string> = {
  primary: 'h-13 bg-primary text-on-primary shadow-highlight hover:bg-primary-hover active:bg-emerald-900',
  secondary: 'h-13 border border-border bg-surface text-text hover:bg-sand-100 active:bg-sand-200',
  danger: 'h-13 border border-coral-500 bg-surface text-coral-600 hover:bg-coral-50 active:bg-coral-50',
  ghost: 'h-11 bg-transparent text-ink-600 hover:bg-sand-100 active:bg-sand-200',
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  /** Replaces the label with a spinner, keeps the width and blocks presses. */
  loading?: boolean
  fullWidth?: boolean
}

export function Button({
  variant = 'primary',
  loading = false,
  fullWidth = false,
  disabled,
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'type-title relative inline-flex items-center justify-center gap-2 rounded-md px-4',
        'transition-[transform,background-color] duration-(--duration-tap) ease-standard',
        'not-disabled:active:scale-[0.98] disabled:cursor-not-allowed',
        !loading && 'disabled:opacity-40',
        variants[variant],
        fullWidth && 'w-full',
        className,
      )}
      {...rest}
    >
      <span className={cn('inline-flex items-center gap-2', loading && 'invisible')}>{children}</span>
      {loading && (
        <span className="absolute inset-0 grid place-items-center" aria-hidden="true">
          <span className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        </span>
      )}
    </button>
  )
}
