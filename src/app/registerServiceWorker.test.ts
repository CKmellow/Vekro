import { describe, expect, it, vi } from 'vitest'

vi.mock('virtual:pwa-register', () => ({ registerSW: vi.fn() }))

describe('registerServiceWorker', () => {
  it('does nothing outside production builds', async () => {
    const { registerSW } = await import('virtual:pwa-register')
    const { registerServiceWorker } = await import('./registerServiceWorker')
    await registerServiceWorker()
    expect(registerSW).not.toHaveBeenCalled()
  })
})
