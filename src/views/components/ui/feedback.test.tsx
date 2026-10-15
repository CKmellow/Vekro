import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { toast } from '@/lib/toast'
import { Banner } from './Banner'
import { ConfirmDialog } from './ConfirmDialog'
import { EmptyState } from './EmptyState'
import { Sheet } from './Sheet'
import { SkeletonGroup, Skeleton } from './Skeleton'
import { Toaster } from './Toast'

afterEach(() => toast.current().forEach((t) => toast.dismiss(t.id)))

describe('Toaster', () => {
  it('shows a toast from anywhere and drops it on dismiss', () => {
    render(<Toaster />)
    let id = 0
    act(() => {
      id = toast.show('Link copied')
    })
    expect(screen.getByText('Link copied')).toBeInTheDocument()
    act(() => toast.dismiss(id))
    expect(screen.queryByText('Link copied')).not.toBeInTheDocument()
  })
})

describe('Banner', () => {
  it('announces danger as an alert and others as status', () => {
    render(
      <>
        <Banner tone="danger" title="M-Pesa didn't go through. Check your balance and try again" />
        <Banner tone="escalation" title="Vekro support is reviewing this" />
      </>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent("M-Pesa didn't go through")
    expect(screen.getByRole('status')).toHaveTextContent('Vekro support is reviewing this')
  })
})

describe('Sheet', () => {
  it('is a labelled dialog that closes on Escape', async () => {
    const onOpenChange = vi.fn()
    render(
      <Sheet open onOpenChange={onOpenChange} title="What's wrong?" description="Your code stays hidden.">
        <button type="button">Damaged</button>
      </Sheet>,
    )
    expect(screen.getByRole('dialog', { name: "What's wrong?" })).toHaveAccessibleDescription(
      'Your code stays hidden.',
    )
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})

describe('ConfirmDialog', () => {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    title: 'Refund KES 52,000 to the buyer?',
    body: "This releases KES 52,000 to Brian Otieno now. You can't undo this.",
    confirmLabel: 'Refund KES 52,000',
    destructive: true,
  }

  it('starts on the safe choice and confirms on request', async () => {
    const onConfirm = vi.fn()
    render(<ConfirmDialog {...props} onConfirm={onConfirm} />)
    expect(screen.getByRole('alertdialog', { name: props.title })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: 'Refund KES 52,000' }))
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('cannot be dismissed while the action runs', async () => {
    const onOpenChange = vi.fn()
    render(<ConfirmDialog {...props} onOpenChange={onOpenChange} onConfirm={vi.fn()} loading />)
    await userEvent.keyboard('{Escape}')
    expect(onOpenChange).not.toHaveBeenCalled()
  })
})

describe('Skeleton and EmptyState', () => {
  it('announces loading once and renders the empty action', () => {
    render(
      <>
        <SkeletonGroup label="Loading orders">
          <Skeleton className="h-4" />
        </SkeletonGroup>
        <EmptyState
          illustration="parcel"
          title="No orders yet"
          body="When you buy with a Vekro link, it shows up here."
        />
      </>,
    )
    expect(screen.getByRole('status', { name: 'Loading orders' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('heading', { name: 'No orders yet' })).toBeInTheDocument()
  })
})
