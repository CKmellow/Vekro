import { cn } from '@/lib/cn'

/** On/off switch on a native checkbox (`role="switch"`), so keyboard and screen readers just work. */
export function Switch({
  label,
  checked,
  onChange,
  disabled,
  title,
}: {
  /** Accessible name, such as "Payment received by SMS". */
  label: string
  checked: boolean
  onChange: () => void
  disabled?: boolean
  title?: string
}) {
  return (
    <label
      className={cn(
        'relative inline-flex min-h-11 items-center',
        disabled ? 'cursor-not-allowed' : 'cursor-pointer',
      )}
      title={title}
    >
      <input
        type="checkbox"
        role="switch"
        aria-label={label}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="peer sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          'h-7 w-12 rounded-full bg-sand-300 transition-colors duration-(--duration-tap)',
          'peer-checked:bg-primary peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-emerald-400',
          'peer-disabled:opacity-60',
        )}
      />
      <span
        aria-hidden="true"
        className="absolute left-1 size-5 rounded-full bg-sand-0 shadow-1 transition-transform duration-(--duration-tap) peer-checked:translate-x-5"
      />
    </label>
  )
}
