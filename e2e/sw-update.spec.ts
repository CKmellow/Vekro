/// <reference lib="dom" />
import { expect, test, type Page } from '@playwright/test'

// #302: after a deploy, a browser that already runs the app moves to the new version by itself, but never in the
// middle of a payment. e2e/sw-update/server.mjs serves build A or B and switches on POST /__deploy/<A|B>.

const build = (page: Page) => page.locator('meta[name="vekro-build"]').getAttribute('content')
const deploy = async (page: Page, to: 'A' | 'B') => {
  const response = await page.request.post(`/__deploy/${to}`)
  expect(response.status()).toBe(204)
}
const controlled = (page: Page) =>
  page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 20_000 })
const checkForUpdate = (page: Page) =>
  page.evaluate(async () => {
    const registration = await navigator.serviceWorker.getRegistration()
    await registration?.update()
  })

test.beforeEach(async ({ page }) => deploy(page, 'A'))

test('a returning browser runs the new deploy after a reload', async ({ page }) => {
  await page.goto('/')
  expect(await build(page)).toBe('e2e-A')
  await controlled(page)

  await deploy(page, 'B')
  await page.reload()
  await expect.poll(() => build(page), { timeout: 30_000 }).toBe('e2e-B')
  await controlled(page)
  expect(await page.evaluate(() => fetch('/version.json').then((r) => r.json()))).toEqual({ build: 'e2e-B' })
})

test('an open tab picks up the new deploy without a manual reload', async ({ page }) => {
  await page.goto('/help')
  await controlled(page)

  await deploy(page, 'B')
  await checkForUpdate(page)
  await expect.poll(() => build(page), { timeout: 30_000 }).toBe('e2e-B')
  expect(new URL(page.url()).pathname).toBe('/help')
})

test('never reloads a payment page; updates once the buyer leaves it', async ({ page }) => {
  await page.goto('/pay/listing-under-test')
  await controlled(page)
  // A marker that a reload would wipe.
  await page.evaluate(() => Object.assign(window, { __stillHere: true }))

  await deploy(page, 'B')
  await checkForUpdate(page)
  // The new version is installed and waiting...
  await page.waitForFunction(
    async () => Boolean((await navigator.serviceWorker.getRegistration())?.waiting),
    undefined,
    {
      timeout: 20_000,
    },
  )
  // ...but the payment page stays as it is.
  await page.waitForTimeout(4_000)
  expect(await page.evaluate(() => (window as unknown as { __stillHere?: boolean }).__stillHere)).toBe(true)
  expect(await build(page)).toBe('e2e-A')

  // The buyer moves on inside the app (client-side navigation): now the update applies.
  await page.evaluate(() => {
    history.pushState({}, '', '/help')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect.poll(() => build(page), { timeout: 30_000 }).toBe('e2e-B')
})
