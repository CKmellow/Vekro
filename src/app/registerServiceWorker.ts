/**
 * Registers the PWA service worker in production builds only (dev uses the MSW worker for gap mocks), and makes
 * a new deploy take over (#302).
 *
 * The worker is built in "prompt" mode: a new version installs and waits. As soon as the page is not in a payment
 * or the door check, it is told to skip waiting, takes control, and the page reloads onto the new version. On a
 * payment page the update waits until the buyer leaves it, so a deploy never reloads a checkout half-way. The same
 * holds when another tab activates the new version: this tab reloads only once it is not mid-payment.
 */

/** Routes where a reload would interrupt a payment (M-Pesa prompt, card checkout, its return) or the door check. */
const MID_PAYMENT = [/^\/pay(\/|$)/, /^\/order\/[^/]+\/(payment|inspect)\/?$/]

export function isMidPayment(pathname: string): boolean {
  return MID_PAYMENT.some((route) => route.test(pathname))
}

/** How often a long-open tab asks for a new worker, besides each time it comes back to the foreground. */
export const UPDATE_CHECK_MS = 5 * 60_000
/** How often a deferred update looks again whether the buyer has left the payment page. */
export const SAFE_POLL_MS = 1_000

/**
 * Runs `apply` now if the page is not mid-payment, otherwise as soon as it is not (client-side navigation fires
 * no event this module could hook, so it polls the path). Returns a cancel function.
 */
export function applyWhenSafe(apply: () => void, pathname: () => string = () => window.location.pathname) {
  if (!isMidPayment(pathname())) {
    apply()
    return () => {}
  }
  const timer = setInterval(() => {
    if (isMidPayment(pathname())) return
    clearInterval(timer)
    apply()
  }, SAFE_POLL_MS)
  return () => clearInterval(timer)
}

/**
 * A lazy page chunk of the previous deploy is gone from the server and the cache: reload once onto the current
 * build. A page that is itself the result of a reload never reloads again, so a broken build cannot loop.
 */
export function reloadOnStaleChunk(
  reload: () => void = () => window.location.reload(),
  navigationType: () => string | undefined = () =>
    (performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined)?.type,
) {
  window.addEventListener('vite:preloadError', (event) => {
    if (navigationType() === 'reload') return
    event.preventDefault()
    reload()
  })
}

/**
 * A new version took control of this page (activated here or from another tab): reload onto it, but never
 * mid-payment, and only once. The first worker ever to claim the page is not a new version.
 */
export function reloadOnNewController(
  container: Pick<ServiceWorkerContainer, 'controller' | 'addEventListener'>,
  reload: () => void = () => window.location.reload(),
  pathname?: () => string,
) {
  let hadController = container.controller !== null
  let pending = false
  container.addEventListener('controllerchange', () => {
    const isNewVersion = hadController
    hadController = true
    if (!isNewVersion || pending) return
    pending = true
    applyWhenSafe(reload, pathname)
  })
}

export async function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  reloadOnStaleChunk()
  reloadOnNewController(navigator.serviceWorker)
  const { registerSW } = await import('virtual:pwa-register')
  let cancelPending = () => {}
  const updateSW = registerSW({
    immediate: true,
    // A new version is waiting: activate it (the page then reloads) once that cannot interrupt a payment.
    onNeedRefresh: () => {
      cancelPending()
      cancelPending = applyWhenSafe(() => void updateSW(true))
    },
    // Reloads are done by reloadOnNewController below: registerSW skips them for a tab whose first visit
    // installed the worker (workbox-window then reports the change with isUpdate false).
    onNeedReload: () => {},
    onRegisteredSW: (_url, registration) => {
      if (!registration) return
      const check = () => void registration.update().catch(() => {})
      setInterval(check, UPDATE_CHECK_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })
}
