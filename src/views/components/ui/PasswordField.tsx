import { Check, Circle, Eye, EyeOff, X } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { cn } from '@/lib/cn'
import { Field, type FieldProps } from './Field'

export interface PasswordStrength {
  score: number
  label: string
}
export interface PasswordRule {
  id: string
  label: string
  met: boolean
}

export interface PasswordFieldProps
  extends Omit<FieldProps, 'valid' | 'aside'>, Omit<ComponentProps<'input'>, 'type'> {
  /** Show the four-segment meter and the rules checklist (sign up only). */
  strength?: PasswordStrength
  rules?: PasswordRule[]
  /** Small confirmation on the right of the label, such as "Passwords match". */
  confirmation?: string
}

const meterTone = (score: number) =>
  score <= 1
    ? 'bg-coral-500'
    : score === 2
      ? 'bg-saffron-500'
      : score === 3
        ? 'bg-saffron-500'
        : 'bg-emerald-600'
const labelTone = (score: number) =>
  score <= 1 ? 'text-coral-600' : score <= 3 ? 'text-saffron-700' : 'text-emerald-700'

/** Password with a show/hide toggle; on sign up, a strength meter and the rules checklist. */
export function PasswordField({
  label,
  hint,
  error,
  strength,
  rules,
  confirmation,
  className,
  ...rest
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <Field
        label={label}
        hint={hint}
        error={error}
        aside={
          confirmation && !error ? (
            <span className="type-body-sm inline-flex items-center gap-1 text-emerald-700">
              <Check aria-hidden="true" className="size-4" />
              {confirmation}
            </span>
          ) : undefined
        }
      >
        {({ id, describedBy }) => (
          <div className="relative">
            <input
              id={id}
              type={visible ? 'text' : 'password'}
              aria-describedby={describedBy}
              aria-invalid={error ? true : undefined}
              className={cn(
                'type-body-lg h-14 w-full rounded-md border bg-surface pr-14 pl-4 text-text placeholder:text-ink-400',
                'transition-[border-color,box-shadow] duration-(--duration-state) ease-standard',
                'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none',
                error ? 'border-coral-500 focus:ring-coral-50' : 'border-border',
                className,
              )}
              {...rest}
            />
            <button
              type="button"
              onClick={() => setVisible((v) => !v)}
              aria-label={visible ? 'Hide password' : 'Show password'}
              aria-pressed={visible}
              className="absolute top-1/2 right-2 grid size-10 -translate-y-1/2 place-items-center rounded-sm text-ink-600 hover:bg-sand-100"
            >
              {visible ? (
                <EyeOff aria-hidden="true" className="size-5" />
              ) : (
                <Eye aria-hidden="true" className="size-5" />
              )}
            </button>
          </div>
        )}
      </Field>
      {strength && (
        <div className="flex items-center gap-3">
          <div className="flex flex-1 gap-1.5" aria-hidden="true">
            {[1, 2, 3, 4].map((segment) => (
              <span
                key={segment}
                className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors duration-(--duration-state)',
                  segment <= strength.score ? meterTone(strength.score) : 'bg-sand-200',
                )}
              />
            ))}
          </div>
          <span
            className={cn('type-body-sm min-w-16 text-right font-semibold', labelTone(strength.score))}
            aria-live="polite"
          >
            {strength.score > 0 ? strength.label : ''}
          </span>
        </div>
      )}
      {rules && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1" aria-label="Password rules">
          {rules.map((rule) => (
            <li
              key={rule.id}
              className={cn(
                'type-body-sm inline-flex items-center gap-1.5',
                rule.met ? 'text-emerald-700' : 'text-text-muted',
              )}
            >
              {rule.met ? (
                <Check aria-hidden="true" className="size-4" />
              ) : error ? (
                <X aria-hidden="true" className="size-4 text-coral-600" />
              ) : (
                <Circle aria-hidden="true" className="size-3.5" />
              )}
              {rule.label}
              <span className="sr-only">{rule.met ? ', done' : ', not yet'}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
