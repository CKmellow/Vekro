import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter } from 'react-router'
import { LoadingPage, NotReadyPage, OfflinePage, SLOW_AFTER_MS } from './system'

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

describe('OfflinePage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('offers a retry and help, and retries by itself once back online', () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false)
    const onRetry = vi.fn()
    render(
      <MemoryRouter>
        <OfflinePage onRetry={onRetry} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: "You're offline" })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Get help' })).toHaveAttribute('href', '/help')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()

    online.mockReturnValue(true)
    act(() => {
      window.dispatchEvent(new Event('online'))
    })
    expect(onRetry).toHaveBeenCalledTimes(2)
  })
})

describe('NotReadyPage', () => {
  it('points sellers back to built pages', () => {
    render(
      <MemoryRouter>
        <NotReadyPage area="seller" name="Reports" />
      </MemoryRouter>,
    )
    expect(screen.getByText(/building the Reports page/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Go to your listings' })).toHaveAttribute(
      'href',
      '/seller/listings',
    )
  })
})
