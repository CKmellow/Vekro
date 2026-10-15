import { CircleAlert, CircleCheck } from 'lucide-react'
import { useId, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface FieldProps {
  label: string
  /** Shown under the control; replaced by the error when there is one. */
  hint?: string
  error?: string
  /** Shows a check once the value is known good. */
  valid?: boolean
  /** Right side of the label row, such as a character counter. */
  aside?: ReactNode
}

const controlClass = cn(
  'w-full rounded-md border border-border bg-surface text-text type-body-lg placeholder:text-ink-400',
  'transition-[border-color,box-shadow] duration-(--duration-state) ease-standard',
  'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none',
  'disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-ink-400',
  'aria-invalid:border-coral-500 aria-invalid:focus:ring-coral-50',
)

/** Label, control slot and message, wired with ids so screen readers read them together. */
export function Field({
  label,
  hint,
  error,
  valid,
  aside,
  children,
}: FieldProps & { children: (ids: { id: string; describedBy?: string }) => ReactNode }) {
  const id = useId()
  const messageId = `${id}-message`
  const message = error ?? hint
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <label htmlFor={id} className="type-label text-ink-600">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        {children({ id, describedBy: message ? messageId : undefined })}
        {valid && !error && (
          <CircleCheck
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 right-4 size-5 -translate-y-1/2 text-emerald-600"
          />
        )}
      </div>
      {message && (
        <p
          id={messageId}
          role={error ? 'alert' : undefined}
          className={cn(
            'type-body-sm flex items-center gap-1.5',
            error ? 'text-coral-600' : 'text-text-muted',
          )}
        >
          {error && <CircleAlert aria-hidden="true" className="size-4 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  )
}

export function TextField({
  label,
  hint,
  error,
  valid,
  className,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <Field label={label} hint={hint} error={error} valid={valid}>
      {({ id, describedBy }) => (
        <input
          id={id}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlClass, 'h-14 px-4', valid && 'pr-12', className)}
          {...rest}
        />
      )}
    </Field>
  )
}

export function TextArea({
  label,
  hint,
  error,
  maxLength,
  value = '',
  className,
  ...rest
}: Omit<FieldProps, 'valid' | 'aside'> & TextareaHTMLAttributes<HTMLTextAreaElement> & { value?: string }) {
  const counter = maxLength ? (
    <span className="type-mono text-text-muted" aria-hidden="true">
      {value.length}/{maxLength}
    </span>
  ) : undefined
  return (
    <Field label={label} hint={hint} error={error} aside={counter}>
      {({ id, describedBy }) => (
        <textarea
          id={id}
          value={value}
          maxLength={maxLength}
          aria-describedby={describedBy}
          aria-invalid={error ? true : undefined}
          className={cn(controlClass, 'min-h-28 resize-y px-4 py-3', className)}
          {...rest}
        />
      )}
    </Field>
  )
}
