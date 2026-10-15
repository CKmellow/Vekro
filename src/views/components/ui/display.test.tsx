import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DataTable, type Column } from './DataTable'
import { MoneyText } from './MoneyText'
import { Pagination } from './Pagination'
import { SegmentedControl } from './SegmentedControl'
import { Tabs } from './Tabs'

describe('MoneyText', () => {
  it('reads the final amount even while counting up', () => {
    render(<MoneyText amount="52000.00" countUp />)
    expect(screen.getByText('KES 52,000', { selector: '.sr-only' })).toBeInTheDocument()
  })
})

describe('Tabs and SegmentedControl', () => {
  it('switches tabs with the keyboard', async () => {
    const onValueChange = vi.fn()
    render(
      <Tabs
        label="Order detail"
        value="summary"
        onValueChange={onValueChange}
        items={[
          { value: 'summary', label: 'Summary', content: 'Summary panel' },
          { value: 'timeline', label: 'Timeline', content: 'Timeline panel' },
        ]}
      />,
    )
    await userEvent.click(screen.getByRole('tab', { name: 'Summary' }))
    await userEvent.keyboard('{ArrowRight}')
    expect(onValueChange).toHaveBeenCalledWith('timeline')
  })

  it('selects a segment and shows its count', async () => {
    const onChange = vi.fn()
    render(
      <SegmentedControl
        label="Filter orders"
        value="all"
        onChange={onChange}
        segments={[
          { value: 'all', label: 'All' },
          { value: 'action', label: 'Needs action', count: 3 },
        ]}
      />,
    )
    const needsAction = screen.getByRole('radio', { name: /needs action/i })
    expect(needsAction.closest('label')).toHaveTextContent('3')
    await userEvent.click(needsAction)
    expect(onChange).toHaveBeenCalledWith('action')
  })
})

describe('Pagination', () => {
  it('disables previous on the first page and moves forward', async () => {
    const onPageChange = vi.fn()
    render(<Pagination page={1} pageCount={3} onPageChange={onPageChange} />)
    expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: 'Next page' }))
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})

describe('DataTable', () => {
  interface Row {
    id: string
    item: string
    amount: string
  }
  const columns: Column<Row>[] = [
    { key: 'item', header: 'Item', cell: (r) => r.item, hideOnCard: true },
    { key: 'amount', header: 'Amount', cell: (r) => r.amount, sortable: true, align: 'end' },
  ]
  const rows = [{ id: 'VK-7K3P9Q', item: 'iPhone 13, 128GB', amount: 'KES 52,000' }]

  it('renders a sortable table and mobile cards from the same columns', async () => {
    const onSortChange = vi.fn()
    render(
      <DataTable
        caption="Recent orders"
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        cardTitle={(r) => r.item}
        sort={{ key: 'amount', direction: 'asc' }}
        onSortChange={onSortChange}
      />,
    )
    const table = screen.getByRole('table', { name: 'Recent orders' })
    expect(within(table).getByRole('columnheader', { name: /amount/i })).toHaveAttribute(
      'aria-sort',
      'ascending',
    )
    await userEvent.click(within(table).getByRole('button', { name: /amount/i }))
    expect(onSortChange).toHaveBeenCalledWith({ key: 'amount', direction: 'desc' })

    const cards = screen.getByRole('list', { name: 'Recent orders' })
    expect(within(cards).getByText('iPhone 13, 128GB')).toBeInTheDocument()
    expect(within(cards).queryByText('Item')).not.toBeInTheDocument()
  })
})
