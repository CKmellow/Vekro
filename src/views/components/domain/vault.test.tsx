import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { LockRingState } from '@/lib/status'
import { LockRing } from './LockRing'
import { MoneyPath } from './MoneyPath'
import { VaultCard } from './VaultCard'

describe('LockRing', () => {
  it.each<LockRingState>([
    'open',
    'locked',
    'pulse',
    'draining',
    'releasing',
    'released',
    'refunded',
    'returned',
    'coral',
    'lake',
    'plum',
  ])('renders the %s state as decoration', (state) => {
    const { container } = render(<LockRing state={state} remaining={0.4} />)
    const ring = container.firstElementChild
    expect(ring).toHaveAttribute('data-state', state)
    expect(ring).toHaveAttribute('aria-hidden', 'true')
  })
})

describe('VaultCard', () => {
  it('names the order and states the amount and status in words', () => {
    render(
      <VaultCard
        reference="VK-7K3P9Q"
        amountLabel="Amount held"
        amount="52000"
        status={{ label: 'Paid, funds held safely', tone: 'emerald', icon: 'lock' }}
        ring="locked"
        hint="Held until you confirm"
      />,
    )
    const vault = screen.getByRole('region', { name: 'Vault for order VK-7K3P9Q' })
    expect(vault).toHaveTextContent('Amount held')
    expect(vault).toHaveTextContent('KES 52,000')
    expect(vault).toHaveTextContent('Paid, funds held safely')
    expect(vault).toHaveTextContent('Held until you confirm')
  })
})

describe('MoneyPath', () => {
  it('marks where the money is', () => {
    render(
      <MoneyPath
        buyer={{ title: 'Buyer', detail: '+254 712 *** 678' }}
        vault={{ title: 'Vekro vault', detail: 'KES 52,000 held' }}
        seller={{ title: 'Seller', detail: 'Amina Gadgets' }}
        position="vault"
      />,
    )
    expect(screen.getByText('Money path: the money is with Vekro vault.')).toBeInTheDocument()
    expect(screen.getByText('Vekro vault').closest('li')).toHaveAttribute('aria-current', 'step')
  })
})
