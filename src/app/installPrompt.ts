/**
 * "Install Vekro" (#304). Chrome on Android fires `beforeinstallprompt` when the app can be installed,
 * often before the landing page's code has loaded, so it is caught here at start-up and kept until the
 * page asks for it. Other browsers never fire it, so the hint never shows there.
 */
export interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: InstallPromptEvent | null = null
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((listener) => listener())

export function isAndroid(userAgent: string = navigator.userAgent): boolean {
  return /Android/i.test(userAgent)
}

export function captureInstallPrompt(target: Window = window) {
  target.addEventListener('beforeinstallprompt', (event) => {
    if (!isAndroid()) return
    event.preventDefault() // keep Chrome's mini-infobar away; the page offers its own hint
    deferred = event as InstallPromptEvent
    notify()
  })
  target.addEventListener('appinstalled', () => {
    deferred = null
    notify()
  })
}

export function installPromptAvailable(): boolean {
  return deferred !== null
}

export function subscribeInstallPrompt(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Shows Chrome's install dialog. The event can be used once, whatever the person chooses. */
export async function promptInstall(): Promise<'accepted' | 'dismissed' | 'unavailable'> {
  const event = deferred
  if (!event) return 'unavailable'
  deferred = null
  notify()
  await event.prompt()
  return (await event.userChoice).outcome
}
