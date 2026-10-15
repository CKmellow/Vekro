import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'
import { AdminLayout } from './AdminLayout'
import { BuyerLayout } from './BuyerLayout'

const at = (path: string, ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

describe('BuyerLayout', () => {
  it('shows the escrow promise in the header and one main column', () => {
    at('/order/1', <BuyerLayout>Tracker</BuyerLayout>)
    expect(screen.getByRole('banner')).toHaveTextContent('Protected by Vekro Escrow')
    expect(screen.getByRole('main')).toHaveTextContent('Tracker')
  })
})

describe('AdminLayout', () => {
  it('shows the queue count and the current section', () => {
    at(
      '/admin',
      <AdminLayout name="Wanjiru K." queueCount={4}>
        Queue
      </AdminLayout>,
    )
    expect(screen.getByText('4 in queue')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /queue/i })).toHaveAttribute('aria-current', 'page')
    expect(screen.queryByRole('button', { name: 'Sign out' })).not.toBeInTheDocument()
  })
})
