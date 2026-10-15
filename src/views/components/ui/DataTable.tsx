import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface Column<T> {
  key: string
  header: string
  cell: (row: T) => ReactNode
  align?: 'start' | 'end'
  sortable?: boolean
  /** Hide this column in the mobile card (for example, the title shown as the card heading). */
  hideOnCard?: boolean
}

export type SortDirection = 'asc' | 'desc'
export interface Sort {
  key: string
  direction: SortDirection
}

export interface DataTableProps<T> {
  caption: string
  columns: Column<T>[]
  rows: T[]
  rowKey: (row: T) => string
  sort?: Sort
  onSortChange?: (sort: Sort) => void
  /** Right-hand row action, such as a "Dispatch" button. */
  action?: (row: T) => ReactNode
  /** Heading of each mobile card. */
  cardTitle: (row: T) => ReactNode
}

const ariaSort = (column: string, sort?: Sort) =>
  sort?.key === column ? (sort.direction === 'asc' ? 'ascending' : 'descending') : undefined

/** Table from 768px (sticky sand header, 56px rows, hover tint); stacked cards below. */
export function DataTable<T>({
  caption,
  columns,
  rows,
  rowKey,
  sort,
  onSortChange,
  action,
  cardTitle,
}: DataTableProps<T>) {
  const toggle = (key: string) =>
    onSortChange?.({
      key,
      direction: sort?.key === key && sort.direction === 'asc' ? 'desc' : 'asc',
    })

  return (
    <>
      <div className="hidden overflow-x-auto rounded-lg bg-surface shadow-1 md:block">
        <table className="w-full border-collapse text-left">
          <caption className="sr-only">{caption}</caption>
          <thead className="sticky top-0 bg-sand-100">
            <tr>
              {columns.map((c) => {
                const SortIcon =
                  sort?.key !== c.key ? ArrowUpDown : sort.direction === 'asc' ? ArrowUp : ArrowDown
                return (
                  <th
                    key={c.key}
                    scope="col"
                    aria-sort={c.sortable ? (ariaSort(c.key, sort) ?? 'none') : undefined}
                    className={cn('type-label h-11 px-5 text-ink-600', c.align === 'end' && 'text-right')}
                  >
                    {c.sortable ? (
                      <button
                        type="button"
                        onClick={() => toggle(c.key)}
                        className="inline-flex items-center gap-1 uppercase hover:text-text"
                      >
                        {c.header}
                        <SortIcon aria-hidden="true" className="size-3.5" />
                      </button>
                    ) : (
                      c.header
                    )}
                  </th>
                )
              })}
              {action && (
                <th scope="col" className="type-label h-11 px-5 text-right text-ink-600">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={rowKey(row)}
                className="h-14 border-t border-border transition-colors hover:bg-sand-50"
              >
                {columns.map((c) => (
                  <td
                    key={c.key}
                    className={cn('type-body-sm px-5 text-text', c.align === 'end' && 'text-right')}
                  >
                    {c.cell(row)}
                  </td>
                ))}
                {action && <td className="px-5 text-right">{action(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul aria-label={caption} className="flex flex-col gap-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)} className="flex flex-col gap-3 rounded-lg bg-surface p-4 shadow-1">
            <div className="type-body-md font-semibold text-text">{cardTitle(row)}</div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {columns
                .filter((c) => !c.hideOnCard)
                .map((c) => (
                  <div key={c.key} className="flex flex-col gap-0.5">
                    <dt className="type-label text-text-muted">{c.header}</dt>
                    <dd className="type-body-sm text-text">{c.cell(row)}</dd>
                  </div>
                ))}
            </dl>
            {action && <div className="flex justify-end">{action(row)}</div>}
          </li>
        ))}
      </ul>
    </>
  )
}
