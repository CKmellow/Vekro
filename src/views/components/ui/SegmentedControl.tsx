import { useId } from 'react'
import { cn } from '@/lib/cn'

export interface Segment<T extends string> {
  value: T
  label: string
  /** Shown as a badge, such as the number of orders needing action. */
  count?: number
}

/** One-of-many filter on a sunken track. Native radios: arrow keys and screen readers work for free. */
export function SegmentedControl<T extends string>({
  label,
  segments,
  value,
  onChange,
}: {
  label: string
  segments: Segment<T>[]
  value: T
  onChange: (value: T) => void
}) {
  const name = useId()
  return (
    <fieldset className="min-w-0">
      <legend className="sr-only">{label}</legend>
      <div className="flex gap-1 overflow-x-auto rounded-md bg-sand-100 p-1">
        {segments.map((segment) => (
          <label
            key={segment.value}
            className={cn(
              'type-body-sm relative flex min-h-10 shrink-0 cursor-pointer items-center gap-2 rounded-sm px-3 font-semibold text-ink-600',
              'transition-[background-color,box-shadow] duration-(--duration-state) ease-standard',
              'has-checked:bg-surface has-checked:text-text has-checked:shadow-1',
              'has-focus-visible:outline-3 has-focus-visible:outline-emerald-400',
            )}
          >
            <input
              type="radio"
              name={name}
              value={segment.value}
              checked={value === segment.value}
              onChange={() => onChange(segment.value)}
              className="sr-only"
            />
            {segment.label}
            {segment.count !== undefined && (
              <span className="rounded-full bg-sand-200 px-1.5 font-mono text-label leading-5 font-semibold text-ink-800 tabular-nums">
                {segment.count}
              </span>
            )}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
