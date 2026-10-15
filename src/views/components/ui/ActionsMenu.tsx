import { MoreVertical, type LucideIcon } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '@/lib/cn'

export interface MenuAction {
  label: string
  Icon: LucideIcon
  onSelect: () => void
  destructive?: boolean
}

/** Three-dot menu. Escape and outside clicks close it; focus returns to the button. */
export function ActionsMenu({ label, actions }: { label: string; actions: MenuAction[] }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointer = (e: PointerEvent) => !root.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'grid size-10 place-items-center rounded-md border border-border transition-colors',
          open ? 'bg-ink-950 text-sand-0' : 'bg-surface text-ink-600 hover:bg-sand-100',
        )}
      >
        <MoreVertical aria-hidden="true" className="size-5" />
      </button>
      {open && (
        <ul
          id={id}
          className="absolute right-0 bottom-12 z-30 flex w-48 flex-col rounded-md border border-border bg-surface p-1 shadow-3"
        >
          {actions.map(({ label: text, Icon, onSelect, destructive }) => (
            <li key={text} className={destructive ? 'mt-1 border-t border-border pt-1' : undefined}>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  onSelect()
                }}
                className={cn(
                  'type-body-md flex min-h-10 w-full items-center gap-2.5 rounded-sm px-3 text-left hover:bg-sand-100',
                  destructive ? 'text-coral-600' : 'text-text',
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
                {text}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
