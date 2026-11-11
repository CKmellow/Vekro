import { afterEach, describe, expect, it, vi } from 'vitest'
import {
  applyWhenSafe,
  isMidPayment,
  reloadOnNewController,
  reloadOnStaleChunk,
  SAFE_POLL_MS,
} from './registerServiceWorker'

vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }))

afterEach(() => vi.useRealTimers())

describe('registerServiceWorker', () => {
  it('does nothing outside production builds', async () => {
    const { registerSW } = await import('virtual:pwa-register')
    const { registerServiceWorker } = await import('./registerServiceWorker')
    await registerServiceWorker()
    expect(registerSW).not.toHaveBeenCalled()
  })
})

describe('isMidPayment (#302)', () => {
  it.each(['/pay/abc', '/pay/return', '/order/42/payment', '/order/42/inspect', '/order/42/payment/'])(
    'treats %s as a payment in progress',
    (path) => expect(isMidPayment(path)).toBe(true),
  )
  it.each(['/', '/login', '/order/42', '/order/42/timeline', '/seller/orders/1', '/payments', '/paying'])(
    'lets %s reload',
    (path) => expect(isMidPayment(path)).toBe(false),
  )
})

describe('applyWhenSafe (#302)', () => {
  it('applies the update at once outside a payment', () => {
    const apply = vi.fn()
    applyWhenSafe(apply, () => '/seller')
    expect(apply).toHaveBeenCalledOnce()
  })

  it('waits on a payment page and applies once the buyer leaves it', () => {
    vi.useFakeTimers()
    let path = '/pay/listing-1'
    const apply = vi.fn()
    applyWhenSafe(apply, () => path)
    vi.advanceTimersByTime(SAFE_POLL_MS * 10)
    expect(apply).not.toHaveBeenCalled()
    path = '/pay/return'
    vi.advanceTimersByTime(SAFE_POLL_MS * 10)
    expect(apply).not.toHaveBeenCalled()
    path = '/order/42'
    vi.advanceTimersByTime(SAFE_POLL_MS)
    expect(apply).toHaveBeenCalledOnce()
    vi.advanceTimersByTime(SAFE_POLL_MS * 10)
    expect(apply).toHaveBeenCalledOnce()
  })

  it('can be cancelled while it waits', () => {
    vi.useFakeTimers()
    let path = '/order/42/payment'
    const apply = vi.fn()
    const cancel = applyWhenSafe(apply, () => path)
    cancel()
    path = '/'
    vi.advanceTimersByTime(SAFE_POLL_MS * 5)
    expect(apply).not.toHaveBeenCalled()
  })
})

describe('reloadOnStaleChunk (#302)', () => {
  it('reloads once when a chunk of the previous deploy is missing', () => {
    const reload = vi.fn()
    reloadOnStaleChunk(reload, () => 'navigate')
    const event = new Event('vite:preloadError', { cancelable: true })
    window.dispatchEvent(event)
    expect(reload).toHaveBeenCalledOnce()
    expect(event.defaultPrevented).toBe(true)
  })

  it('never reloads a page that is itself a reload', () => {
    const reload = vi.fn()
    reloadOnStaleChunk(reload, () => 'reload')
    window.dispatchEvent(new Event('vite:preloadError', { cancelable: true }))
    expect(reload).not.toHaveBeenCalled()
  })
})

describe('reloadOnNewController (#302)', () => {
  const container = (controller: object | null) => {
    const target = new EventTarget()
    return Object.assign(target, { controller }) as unknown as ServiceWorkerContainer
  }
  const change = (c: ServiceWorkerContainer) => c.dispatchEvent(new Event('controllerchange'))

  it('does not reload when the first worker claims the page', () => {
    const reload = vi.fn()
    const c = container(null)
    reloadOnNewController(c, reload, () => '/')
    change(c)
    expect(reload).not.toHaveBeenCalled()
    change(c)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('reloads once when a new version replaces the controller', () => {
    const reload = vi.fn()
    const c = container({})
    reloadOnNewController(c, reload, () => '/seller')
    change(c)
    change(c)
    expect(reload).toHaveBeenCalledOnce()
  })

  it('waits on a payment page until the buyer leaves it', () => {
    vi.useFakeTimers()
    let path = '/order/7/payment'
    const reload = vi.fn()
    const c = container({})
    reloadOnNewController(c, reload, () => path)
    change(c)
    vi.advanceTimersByTime(SAFE_POLL_MS * 5)
    expect(reload).not.toHaveBeenCalled()
    path = '/order/7'
    vi.advanceTimersByTime(SAFE_POLL_MS)
    expect(reload).toHaveBeenCalledOnce()
  })
})
