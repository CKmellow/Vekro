import { expect, test, type BrowserContext } from '@playwright/test'
import { axeViolations, paidOrder } from './support'

// M16 #127: axe on every page, against the real app (real CSS, so contrast is checked too).
async function check(context: BrowserContext, paths: string[]) {
  const page = await context.newPage()
  const found: Record<string, string[]> = {}
  for (const path of paths) {
    await page.goto(path)
    await page.waitForLoadState('networkidle')
    await page.locator('h1').first().waitFor()
    const violations = await axeViolations(page)
    if (violations.length) found[path] = violations
  }
  expect(found).toEqual({})
}

test('public pages have no axe violations', async ({ browser }) => {
  await check(await browser.newContext(), [
    '/',
    '/help',
    '/login',
    '/register',
    '/forgot-password',
    '/buyer/sign-in',
    '/admin/login',
    '/nope',
  ])
})

test('buyer and seller pages have no axe violations', async ({ browser, baseURL }) => {
  const seller = await browser.newContext()
  const buyer = await browser.newContext()
  const { orderId } = await paidOrder(seller, buyer, baseURL ?? '', true)
  await check(buyer, ['/buyer/orders', `/order/${orderId}`, `/order/${orderId}/timeline`])
  await check(seller, [
    '/seller',
    '/seller/orders',
    `/seller/orders/${orderId}`,
    '/seller/listings',
    '/seller/listings/new',
    '/seller/returns',
    '/seller/analytics',
    '/seller/settings',
    '/seller/settings?tab=payout',
    '/seller/settings?tab=notifications',
    '/seller/settings?tab=security',
    '/seller/notifications',
    '/onboarding',
  ])
})

test.describe('support console', () => {
  test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false })

  test('console pages have no axe violations', async ({ browser }) => {
    const phone = process.env.E2E_ADMIN_PHONE
    const password = process.env.E2E_ADMIN_PASSWORD
    test.skip(
      !phone || !password,
      'needs E2E_ADMIN_PHONE and E2E_ADMIN_PASSWORD (python -m app.cli create-admin)',
    )
    const admin = await browser.newContext({ viewport: { width: 1280, height: 900 } })
    const login = await admin.request.post('/api/auth/login', { data: { phone, password } })
    expect(login.ok()).toBe(true)
    await check(admin, ['/admin', '/admin/transactions'])
  })
})
