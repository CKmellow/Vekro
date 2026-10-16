import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LoadingPage, SLOW_AFTER_MS } from './system'

describe('LoadingPage', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('announces the wait and marks the page busy', () => {
    render(<LoadingPage />)
    expect(screen.getByRole('status')).toHaveTextContent('Getting things ready')
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
  })

  it('says the wait is unusual and offers a retry once it runs long', () => {
    const onRetry = vi.fn()
    render(<LoadingPage onRetry={onRetry} />)
    act(() => vi.advanceTimersByTime(SLOW_AFTER_MS))
    expect(screen.getByRole('status')).toHaveTextContent('This is taking longer than usual')
    expect(screen.getByRole('main')).toHaveAttribute('aria-busy', 'false')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
