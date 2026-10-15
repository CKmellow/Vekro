import type { InputHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  /** May contain links, such as the terms. */
  children: ReactNode
}

export function Checkbox({ children, className, ...rest }: CheckboxProps) {
  return (
    <label
      className={cn('type-body-md flex min-h-12 cursor-pointer items-center gap-3 text-text', className)}
    >
      <input type="checkbox" className="size-5 shrink-0 cursor-pointer accent-emerald-700" {...rest} />
      <span>{children}</span>
    </label>
  )
}

export interface RadioOption<T extends string> {
  value: T
  title: string
  description?: string
}

export interface RadioCardGroupProps<T extends string> {
  legend: string
  name: string
  options: RadioOption<T>[]
  value: T | undefined
  onChange: (value: T) => void
  disabled?: boolean
}

/** One choice from a set of cards. The selected card lifts (shadow) and turns emerald. */
export function RadioCardGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  disabled,
}: RadioCardGroupProps<T>) {
  return (
    <fieldset className="flex flex-col gap-2" disabled={disabled}>
      <legend className="type-label mb-2 text-ink-600">{legend}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={cn(
              'flex min-h-12 cursor-pointer items-start gap-3 rounded-md border border-border bg-surface p-4',
              'transition-[border-color,box-shadow] duration-(--duration-state) ease-standard',
              'has-checked:border-emerald-600 has-checked:shadow-1 has-focus-visible:ring-4 has-focus-visible:ring-emerald-100',
              'has-disabled:cursor-not-allowed has-disabled:opacity-60',
            )}
          >
            <span className="flex flex-1 flex-col gap-1">
              <span className="type-body-md font-semibold text-text">{option.title}</span>
              {option.description && (
                <span className="type-body-sm text-text-muted">{option.description}</span>
              )}
            </span>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
              className="mt-0.5 size-5 shrink-0 cursor-pointer accent-emerald-700"
            />
          </label>
        ))}
      </div>
    </fieldset>
  )
}
