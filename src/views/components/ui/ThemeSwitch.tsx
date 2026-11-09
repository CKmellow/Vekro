import { Monitor, Moon, Sun } from 'lucide-react'
import { useId } from 'react'
import type { ThemePreference } from '@/lib/theme'
import { cn } from '@/lib/cn'

const OPTIONS: { value: ThemePreference; label: string; Icon: typeof Sun }[] = [
  { value: 'light', label: 'Light', Icon: Sun },
  { value: 'dark', label: 'Dark', Icon: Moon },
  { value: 'system', label: 'Same as device', Icon: Monitor },
]

/**
 * Light / Dark / Same as device (M25, #292). Native radios, so arrow keys and screen readers work;
 * `tone="vault"` for the dark emerald sidebar.
 */
export function ThemeSwitch({
  value: preference,
  onChange: setPreference,
  className,
  tone = 'surface',
}: {
  value: ThemePreference
  onChange: (value: ThemePreference) => void
  className?: string
  tone?: 'surface' | 'vault'
}) {
  const name = useId()
  return (
    <fieldset
      className={cn(
        'inline-flex items-center gap-0.5 rounded-full p-0.5',
        tone === 'vault' ? 'bg-emerald-900' : 'bg-sand-100',
        className,
      )}
    >
      <legend className="sr-only">Theme</legend>
      {OPTIONS.map(({ value, label, Icon }) => (
        <label
          key={value}
          title={label}
          className={cn(
            'grid size-9 cursor-pointer place-items-center rounded-full transition-colors duration-(--duration-tap)',
            'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-emerald-400',
            preference === value
              ? tone === 'vault'
                ? 'bg-primary text-on-primary'
                : 'bg-surface text-primary shadow-1'
              : tone === 'vault'
                ? 'text-emerald-100 hover:text-sand-0'
                : 'text-ink-500 hover:text-text',
          )}
        >
          <input
            type="radio"
            name={name}
            value={value}
            checked={preference === value}
            onChange={() => setPreference(value)}
            className="sr-only"
          />
          <Icon aria-hidden="true" className="size-4" />
          <span className="sr-only">{label}</span>
        </label>
      ))}
    </fieldset>
  )
}
