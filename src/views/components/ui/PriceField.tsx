import type { ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Field, type FieldProps } from './Field'

const grouped = new Intl.NumberFormat('en-KE', { maximumFractionDigits: 0 })

export interface PriceFieldProps
  extends Omit<FieldProps, 'valid' | 'aside'>, Omit<ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  /** Whole KES; NaN while empty. */
  value: number
  onChange: (value: number) => void
}

/** Price in KES: large mono digits grouped as you type ("52,000"). */
export function PriceField({ label, hint, error, value, onChange, className, ...rest }: PriceFieldProps) {
  return (
    <Field label={label} hint={hint} error={error}>
      {({ id, describedBy }) => (
        <div
          className={cn(
            'flex h-16 items-center gap-3 rounded-md border bg-surface px-4',
            'focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100',
            error ? 'border-coral-500' : 'border-border',
          )}
        >
          <span className="type-mono rounded-xs bg-sand-100 px-2 py-1 text-ink-600">KES</span>
          <input
            id={id}
            inputMode="numeric"
            autoComplete="off"
            aria-describedby={describedBy}
            aria-invalid={error ? true : undefined}
            value={Number.isFinite(value) ? grouped.format(value) : ''}
            onChange={(e) => {
              const digits = e.target.value.replace(/\D/g, '').slice(0, 10)
              onChange(digits ? Number(digits) : Number.NaN)
            }}
            placeholder="0"
            className={cn(
              'min-w-0 flex-1 bg-transparent font-mono text-headline font-bold text-text tabular-nums placeholder:text-ink-400 focus:outline-none',
              className,
            )}
            {...rest}
          />
        </div>
      )}
    </Field>
  )
}
