import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { BuyerAppLayout } from './BuyerAppLayout'

const at = (path: string, ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

const props = { name: 'Amina Otieno', onSwitchToSelling: vi.fn(), onSignOut: vi.fn() }

describe('BuyerAppLayout', () => {
  it('shows the buyer area with badges and Start selling for an account without a store', () => {
    at(
      '/buyer/orders',
      <BuyerAppLayout {...props} hasStore={false} needsYou={2} openCases={1} hasUnreadNotifications>
        Orders
      </BuyerAppLayout>,
    )
    const sidebar = screen.getAllByRole('navigation', { name: 'Buyer' })[0] as HTMLElement
    expect(within(sidebar).getByRole('link', { name: /^Orders/ })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByRole('link', { name: /Home/ })).toHaveTextContent('2')
    expect(within(sidebar).getByRole('link', { name: /Returns & disputes/ })).toHaveTextContent('1')
    expect(within(sidebar).getByRole('link', { name: /Notifications.*unread/ })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: 'Start selling' })[0]).toHaveAttribute(
      'href',
      '/buyer/start-selling',
    )
    expect(screen.queryByRole('group', { name: 'Switch between buying and selling' })).toBeNull()
  })

  it('switches to selling for an account with a store, and signs out from More', async () => {
    const onSwitchToSelling = vi.fn()
    const onSignOut = vi.fn()
    at(
      '/buyer',
      <BuyerAppLayout {...props} hasStore onSwitchToSelling={onSwitchToSelling} onSignOut={onSignOut}>
        Home
      </BuyerAppLayout>,
    )
    expect(screen.queryByRole('link', { name: 'Start selling' })).toBeNull()
    const [toggle] = screen.getAllByRole('group', { name: 'Switch between buying and selling' })
    expect(within(toggle as HTMLElement).getByRole('radio', { name: 'Buying' })).toBeChecked()
    await userEvent.click(within(toggle as HTMLElement).getByRole('radio', { name: 'Selling' }))
    expect(onSwitchToSelling).toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    const sheet = screen.getByRole('dialog', { name: 'More' })
    expect(within(sheet).getByRole('link', { name: 'Profile & security' })).toBeInTheDocument()
    await userEvent.click(within(sheet).getByRole('button', { name: 'Sign out' }))
    expect(onSignOut).toHaveBeenCalled()
  })
})
