import { afterEach, describe, expect, it, vi } from 'vitest'

const ANDROID = 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 Chrome/131 Mobile Safari/537.36'

function installEvent(outcome: 'accepted' | 'dismissed' = 'accepted') {
  const event = new Event('beforeinstallprompt', { cancelable: true })
  return Object.assign(event, {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  })
}

async function fresh(userAgent: string) {
  vi.resetModules()
  vi.spyOn(navigator, 'userAgent', 'get').mockReturnValue(userAgent)
  const mod = await import('./installPrompt')
  const target = new EventTarget() as unknown as Window
  mod.captureInstallPrompt(target)
  return { mod, target }
}

afterEach(() => vi.restoreAllMocks())

describe('installPrompt (#304)', () => {
  it('keeps Chrome on Android’s install event and stops the mini-infobar', async () => {
    const { mod, target } = await fresh(ANDROID)
    const listener = vi.fn()
    mod.subscribeInstallPrompt(listener)
    const event = installEvent()
    target.dispatchEvent(event)
    expect(event.defaultPrevented).toBe(true)
    expect(mod.installPromptAvailable()).toBe(true)
    expect(listener).toHaveBeenCalled()
  })

  it('ignores the event off Android', async () => {
    const { mod, target } = await fresh('Mozilla/5.0 (X11; Linux x86_64) Chrome/131 Safari/537.36')
    target.dispatchEvent(installEvent())
    expect(mod.installPromptAvailable()).toBe(false)
  })

  it('prompts once and reports the choice', async () => {
    const { mod, target } = await fresh(ANDROID)
    const event = installEvent('dismissed')
    target.dispatchEvent(event)
    await expect(mod.promptInstall()).resolves.toBe('dismissed')
    expect(event.prompt).toHaveBeenCalledOnce()
    expect(mod.installPromptAvailable()).toBe(false)
    await expect(mod.promptInstall()).resolves.toBe('unavailable')
  })

  it('forgets the event once the app is installed', async () => {
    const { mod, target } = await fresh(ANDROID)
    target.dispatchEvent(installEvent())
    target.dispatchEvent(new Event('appinstalled'))
    expect(mod.installPromptAvailable()).toBe(false)
  })
})
