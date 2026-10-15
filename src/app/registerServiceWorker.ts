/** Registers the PWA service worker in production builds only (dev uses the MSW worker for gap mocks). */
export async function registerServiceWorker() {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
  const { registerSW } = await import('virtual:pwa-register')
  registerSW({ immediate: true })
}
