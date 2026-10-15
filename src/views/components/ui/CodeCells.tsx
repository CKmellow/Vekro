import { CircleAlert } from 'lucide-react'
import { useId, useRef, type KeyboardEvent } from 'react'
import { cn } from '@/lib/cn'

export interface CodeCellsProps {
  label: string
  value: string
  onChange: (code: string) => void
  /** Called once every cell is filled. */
  onComplete?: (code: string) => void
  /** The backend sends a 6-digit delivery code. */
  length?: number
  /** A wrong code: the row shakes once and the message is announced. */
  error?: string
  disabled?: boolean
}

/** One-time code entry. Typing advances, pasting or SMS autofill spreads the digits, backspace steps back. */
export function CodeCells({
  label,
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  disabled,
}: CodeCellsProps) {
  const id = useId()
  const cells = useRef<(HTMLInputElement | null)[]>([])
  const focus = (index: number) => cells.current[Math.max(0, Math.min(index, length - 1))]?.focus()

  const update = (next: string) => {
    const code = next.slice(0, length)
    onChange(code)
    if (code.length === length) onComplete?.(code)
  }

  const handleInput = (index: number, raw: string) => {
    let digits = raw.replace(/\D/g, '')
    // Typed into a filled cell without the select-on-focus (clicked while focused): keep the new digit.
    if (digits.length === 2 && value[index] && digits.startsWith(value[index])) digits = digits.slice(1)
    if (!digits) return update(value.slice(0, index) + value.slice(index + 1))
    const start = Math.min(index, value.length)
    update(value.slice(0, start) + digits + value.slice(start + digits.length))
    focus(start + digits.length)
  }

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      e.preventDefault()
      update(value.slice(0, index - 1) + value.slice(index))
      focus(index - 1)
    } else if (e.key === 'ArrowLeft') focus(index - 1)
    else if (e.key === 'ArrowRight') focus(index + 1)
  }

  return (
    <div className="flex flex-col gap-3">
      <p id={`${id}-label`} className="type-label text-ink-600">
        {label}
      </p>
      <div
        role="group"
        aria-labelledby={`${id}-label`}
        aria-describedby={error ? `${id}-error` : undefined}
        className={cn('flex gap-2 sm:gap-3', error && 'animate-shake')}
      >
        {Array.from({ length }, (_, i) => (
          <input
            key={i}
            ref={(el) => {
              cells.current[i] = el
            }}
            type="text"
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            aria-label={`Digit ${i + 1} of ${length}`}
            aria-invalid={error ? true : undefined}
            value={value[i] ?? ''}
            disabled={disabled}
            onFocus={(e) => e.target.select()}
            onChange={(e) => handleInput(i, e.target.value)}
            onKeyDown={(e) => handleKeyDown(i, e)}
            className={cn(
              'type-otp h-20 w-full max-w-16 min-w-0 rounded-md border bg-surface text-center text-text',
              'transition-[border-color,box-shadow] duration-(--duration-state) ease-standard',
              'focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 focus:outline-none',
              'disabled:cursor-not-allowed disabled:bg-sand-100 disabled:text-ink-400',
              error ? 'border-coral-500' : 'border-border',
            )}
          />
        ))}
      </div>
      {error && (
        <p id={`${id}-error`} role="alert" className="type-body-sm flex items-center gap-1.5 text-coral-600">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
