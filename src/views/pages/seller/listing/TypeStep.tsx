import { Check, Eye, Shirt, Smartphone, type LucideIcon } from 'lucide-react'
import type { UseFormRegisterReturn } from 'react-hook-form'
import { cn } from '@/lib/cn'
import { TextField } from '../../../components/ui/Field'

const OPTIONS: { serial: boolean; title: string; body: string; Icon: LucideIcon }[] = [
  {
    serial: false,
    title: 'Standard item',
    body: 'Clothes, shoes, furniture. The buyer inspects at the door; the sale is final when they give the code.',
    Icon: Shirt,
  },
  {
    serial: true,
    title: 'Serial-numbered item',
    body: 'Phones, laptops, TVs. The buyer gets 24 hours after delivery to report functional problems.',
    Icon: Smartphone,
  },
]

export interface TypeStepProps {
  isSerialized: boolean
  onSelect: (serial: boolean) => void
  uniqueId: UseFormRegisterReturn
  uniqueIdError?: string
  uniqueIdTail: string | null
}

/** S7 step 2: Standard or Serial-numbered; serial-numbered items need the IMEI or serial number. */
export function TypeStep({ isSerialized, onSelect, uniqueId, uniqueIdError, uniqueIdTail }: TypeStepProps) {
  return (
    <div className="flex flex-col gap-5">
      <fieldset className="flex flex-col">
        <legend className="type-headline mb-4 text-text">What kind of item is it?</legend>
        <div className="grid gap-4 sm:grid-cols-2">
          {OPTIONS.map(({ serial, title, body, Icon }) => {
            const selected = isSerialized === serial
            return (
              <label
                key={title}
                className={cn(
                  'relative flex cursor-pointer flex-col gap-3 rounded-lg border-2 bg-surface p-5',
                  'transition-[border-color,background-color,box-shadow] duration-(--duration-state) ease-standard',
                  'has-focus-visible:outline-3 has-focus-visible:outline-emerald-400',
                  selected
                    ? serial
                      ? 'border-lake-500 bg-lake-50 shadow-1'
                      : 'border-emerald-600 bg-emerald-50 shadow-1'
                    : 'border-border',
                )}
              >
                <input
                  type="radio"
                  name="item-type"
                  className="sr-only"
                  checked={selected}
                  onChange={() => onSelect(serial)}
                />
                <span className="grid size-11 place-items-center rounded-md bg-surface text-ink-600 shadow-1">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="type-title text-text">{title}</span>
                <span className="type-body-sm text-ink-600">{body}</span>
                {selected && (
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute top-4 right-4 grid size-6 place-items-center rounded-full text-sand-0',
                      serial ? 'bg-lake-500' : 'bg-emerald-600',
                    )}
                  >
                    <Check className="size-4" strokeWidth={3} />
                  </span>
                )}
              </label>
            )
          })}
        </div>
      </fieldset>
      {isSerialized && (
        <div className="flex flex-col gap-2 rounded-lg border border-border p-5">
          <TextField
            label="Unique ID (IMEI or serial)"
            className="font-mono tracking-wider"
            autoComplete="off"
            spellCheck={false}
            error={uniqueIdError}
            {...uniqueId}
          />
          <p className="type-body-sm flex flex-wrap items-center gap-2 text-text-muted">
            <Eye aria-hidden="true" className="size-4" />
            Buyers will check the last 4 characters at the door
            {uniqueIdTail && (
              <span className="type-mono rounded-xs bg-sand-100 px-1.5 text-text">{uniqueIdTail}</span>
            )}
          </p>
        </div>
      )}
    </div>
  )
}
