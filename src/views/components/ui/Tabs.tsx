import * as RadixTabs from '@radix-ui/react-tabs'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface TabItem {
  value: string
  label: string
  content: ReactNode
}

/** Underlined tabs; arrow keys move between them (Radix). */
export function Tabs({
  items,
  value,
  onValueChange,
  label,
}: {
  items: TabItem[]
  value: string
  onValueChange: (value: string) => void
  label: string
}) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange} className="flex flex-col gap-4">
      <RadixTabs.List aria-label={label} className="flex gap-6 overflow-x-auto border-b border-border">
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            className={cn(
              'type-body-md -mb-px min-h-11 border-b-2 border-transparent font-semibold whitespace-nowrap text-text-muted',
              'transition-colors duration-(--duration-state) ease-standard hover:text-text',
              'data-[state=active]:border-primary data-[state=active]:text-text',
            )}
          >
            {item.label}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>
      {items.map((item) => (
        <RadixTabs.Content key={item.value} value={item.value} className="focus-visible:outline-offset-4">
          {item.content}
        </RadixTabs.Content>
      ))}
    </RadixTabs.Root>
  )
}
