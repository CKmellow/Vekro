import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'
import { SellerLayout } from './SellerLayout'

const at = (path: string, ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

describe('SellerLayout', () => {
  it('marks the current page, shows badges and searches', async () => {
    const onSearch = vi.fn()
    at(
      '/seller/orders',
      <SellerLayout name="Amina Gadgets" ordersNeedingAction={3} onSearch={onSearch}>
        Orders
      </SellerLayout>,
    )
    const sidebar = screen.getAllByRole('navigation', { name: 'Seller' })[0] as HTMLElement
    expect(within(sidebar).getByRole('link', { name: /orders/i })).toHaveAttribute('aria-current', 'page')
    expect(within(sidebar).getByRole('link', { name: /orders/i })).toHaveTextContent('3')
    expect(screen.getByText('Habari, Amina')).toBeInTheDocument()
    await userEvent.type(screen.getByRole('searchbox', { name: 'Search orders' }), 'VK-7K3P9Q{Enter}')
    expect(onSearch).toHaveBeenCalledWith('VK-7K3P9Q')
  })

  it('opens the More sheet from the bottom navigation', async () => {
    at('/seller', <SellerLayout name="Amina Gadgets">Home</SellerLayout>)
    await userEvent.click(screen.getByRole('button', { name: 'More' }))
    const sheet = screen.getByRole('dialog', { name: 'More' })
    expect(within(sheet).getByRole('link', { name: 'Settings' })).toBeInTheDocument()
  })
})
