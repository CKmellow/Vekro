import { useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { formatNational, isValidNational, PHONE_ERROR, toNationalDigits } from '@/lib/phone'
import { Field, type FieldProps } from './Field'

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>

export interface PhoneFieldProps extends Omit<FieldProps, 'valid' | 'aside'>, InputProps {
  /** The 9 national digits, without +254. */
  value: string
  onChange: (digits: string) => void
}

/** Kenyan mobile number with a +254 chip. Formats as you type and accepts pasted 07…, 254… or +254… numbers. */
export function PhoneField({
  label,
  hint,
  error,
  value,
  onChange,
  onBlur,
  disabled,
  ...rest
}: PhoneFieldProps) {
  const [touched, setTouched] = useState(false)
  const shownError = error ?? (touched && value && !isValidNational(value) ? PHONE_ERROR : undefined)
  return (
    <Field label={label} hint={hint} error={shownError} valid={isValidNational(value)}>
      {({ id, describedBy }) => (
        <div
          className={cn(
            'flex h-14 items-center rounded-md border bg-surface pr-12',
            'transition-[border-color,box-shadow] duration-(--duration-state) ease-standard',
            'focus-within:border-emerald-500 focus-within:ring-4 focus-within:ring-emerald-100',
            shownError ? 'border-coral-500 focus-within:ring-coral-50' : 'border-border',
            disabled && 'bg-sand-100',
          )}
        >
          <span className="type-mono mx-2 flex shrink-0 items-center gap-1.5 rounded-sm bg-sand-100 px-2.5 py-1.5 text-text">
            <span aria-hidden="true" className="size-1.5 rounded-full bg-emerald-600" />
            +254
          </span>
          <input
            id={id}
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            placeholder="712 345 678"
            value={formatNational(value)}
            onChange={(e) => onChange(toNationalDigits(e.target.value))}
            onBlur={(e) => {
              setTouched(true)
              onBlur?.(e)
            }}
            disabled={disabled}
            aria-describedby={describedBy}
            aria-invalid={shownError ? true : undefined}
            className="h-full min-w-0 flex-1 bg-transparent font-mono text-body-lg font-semibold tabular-nums text-text placeholder:text-ink-400 focus:outline-none disabled:cursor-not-allowed disabled:text-ink-400"
            {...rest}
          />
        </div>
      )}
    </Field>
  )
}
