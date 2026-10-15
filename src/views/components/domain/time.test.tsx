import { act, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CountdownRing } from './CountdownRing'
import { QrCode } from './QrCode'
import { Stepper } from './Stepper'
import { Timeline } from './Timeline'

describe('CountdownRing', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-10-15T11:00:00Z'))
  })
  afterEach(() => vi.useRealTimers())

  it('ticks from the server deadline, announces at 1 minute, turns coral and expires', () => {
    const onExpire = vi.fn()
    render(
      <CountdownRing
        deadline="2026-10-15T11:01:02Z"
        totalMs={60 * 60_000}
        label="Inspection time"
        onExpire={onExpire}
      />,
    )
    const timer = screen.getByRole('timer')
    expect(timer).toHaveAccessibleName('Inspection time: 1 minute 2 seconds left')
    expect(timer.querySelector('[aria-live]')).toBeEmptyDOMElement()

    act(() => vi.advanceTimersByTime(2000))
    expect(timer.querySelector('[aria-live]')).toHaveTextContent('Inspection time: 1 minute 0 seconds left')
    expect(timer.querySelectorAll('circle')[1]).toHaveClass('stroke-coral-500')

    act(() => vi.advanceTimersByTime(60_000))
    expect(onExpire).toHaveBeenCalledOnce()
  })

  it('corrects for a phone clock that is wrong', () => {
    render(
      <CountdownRing
        deadline="2026-10-15T11:10:00Z"
        totalMs={60 * 60_000}
        serverOffsetMs={5 * 60_000}
        label="Inspection time"
      />,
    )
    expect(screen.getByRole('timer')).toHaveAccessibleName('Inspection time: 5 minutes 0 seconds left')
  })
})

describe('Timeline, Stepper and QrCode', () => {
  it('renders entries, the current step and the code', () => {
    render(
      <>
        <Timeline
          entries={[
            { id: 'u', text: 'Funds release to the seller after you give your code', upcoming: true },
            { id: 'a', time: 'Today 11:20', actor: 'seller', text: 'Amina Gadgets dispatched your order' },
          ]}
        />
        <Stepper steps={['Paid', 'Dispatched', 'At your door', 'Inspected', 'Complete']} current={2} />
        <QrCode value="https://vekro.co.ke/pay/abc" label="QR code for the Trust Link" />
      </>,
    )
    expect(screen.getByRole('list', { name: 'Order timeline' })).toHaveTextContent('Upcoming')
    expect(screen.getByText('Seller')).toBeInTheDocument()
    expect(screen.getByText('At your door').closest('li')).toHaveAttribute('aria-current', 'step')
    expect(screen.getByRole('img', { name: 'QR code for the Trust Link' })).toBeInTheDocument()
  })
})
