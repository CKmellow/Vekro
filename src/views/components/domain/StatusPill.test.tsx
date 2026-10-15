import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StatusPill } from './StatusPill'

describe('StatusPill', () => {
  it('renders the label with a decorative icon and the tone tint', () => {
    render(<StatusPill status={{ label: 'Paid, funds held safely', tone: 'emerald', icon: 'lock' }} />)
    const pill = screen.getByText('Paid, funds held safely').parentElement
    expect(pill).toHaveClass('bg-emerald-50', 'text-emerald-700')
    expect(pill?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })
})
