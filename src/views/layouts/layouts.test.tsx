import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'
import { themeStore } from '@/lib/theme'
import { AdminLayout } from './AdminLayout'
import { BuyerLayout } from './BuyerLayout'

const at = (path: string, ui: React.ReactNode) =>
  render(<MemoryRouter initialEntries={[path]}>{ui}</MemoryRouter>)

afterEach(() => {
  localStorage.clear()
  themeStore.reset()
  document.documentElement.classList.remove('dark')
})

describe('BuyerLayout', () => {
  it('shows the escrow promise in the header and one main column', () => {
    at('/order/1', <BuyerLayout>Tracker</BuyerLayout>)
    expect(screen.getByRole('banner')).toHaveTextContent('Protected by Vekro Escrow')
    expect(screen.getByRole('main')).toHaveTextContent('Tracker')
  })

  it('lets the buyer pick a theme, remembered on this device (M25, #292)', async () => {
    at('/order/1', <BuyerLayout>Tracker</BuyerLayout>)
    const group = screen.getByRole('group', { name: 'Theme' })
    expect(screen.getByRole('radio', { name: 'Same as device' })).toBeChecked()
    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }))
    expect(document.documentElement).toHaveClass('dark')
    expect(localStorage.getItem('vekro.theme')).toBe('dark')
    await userEvent.click(screen.getByRole('radio', { name: 'Light' }))
    expect(document.documentElement).not.toHaveClass('dark')
    expect(group).toBeInTheDocument()
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
