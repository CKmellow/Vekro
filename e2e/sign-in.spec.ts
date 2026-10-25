import { expect, test } from '@playwright/test'
import { freshPhone, paidOrder } from './support'

// Needs the backend's PHONE_CODE_DEV_ECHO=true (local and CI only): no SMS goes out, so the
// request-code response carries the code.
test('a buyer signs in with an SMS code and no password', async ({ page }) => {
  const national = freshPhone()
  await page.goto('/buyer/sign-in')
  await expect(page.getByRole('heading', { name: 'See all your orders' })).toBeVisible()

  await page.getByLabel('Phone number').fill(national)
  const [sent] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/auth/phone/request-code')),
    page.getByRole('button', { name: 'Send code' }).click(),
  ])
  expect(sent.status()).toBe(202)
  const { dev_code: code } = (await sent.json()) as { dev_code: string | null }
  expect(code, 'set PHONE_CODE_DEV_ECHO=true on the backend').toMatch(/^\d{6}$/)
  await expect(page.getByText(`+254 ${national.slice(0, 3)} *** ${national.slice(6)}`)).toBeVisible()

  // A wrong code first: refused, cleared, and the right one still works.
  const wrong = code === '000000' ? '111111' : '000000'
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  await page.keyboard.type(wrong)
  await expect(page.getByRole('alert')).toHaveText(/That code doesn't match/)
  await page.keyboard.type(code ?? '')

  await expect(page).toHaveURL(/\/buyer\/orders$/)
  const me = await page.request.get('/api/auth/me')
  expect(await me.json()).toMatchObject({ role: 'buyer', phone: `+254${national}` })
})

test('an order link opened signed out asks for the phone first, then shows the order', async ({
  browser,
  baseURL,
}) => {
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId, reference } = await paidOrder(sellerContext, buyerContext, baseURL ?? '', false)
  const { phone } = (await (await buyerContext.request.get('/api/auth/me')).json()) as { phone: string }

  // A fresh device: no session, so only the public summary shows.
  const page = await (await browser.newContext()).newPage()
  await page.goto(`/order/${orderId}`)
  await expect(page.getByRole('heading', { name: "Confirm it's you" })).toBeVisible()
  await expect(page.getByText(reference)).toBeVisible()
  await expect(page.getByText('Amina Gadgets')).toHaveCount(0)

  await page.getByLabel('Phone number').fill(phone.slice(4))
  const [sent] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith('/api/auth/phone/request-code')),
    page.getByRole('button', { name: 'Show my order' }).click(),
  ])
  const { dev_code: code } = (await sent.json()) as { dev_code: string }
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  await page.keyboard.type(code)

  await expect(page.getByRole('heading', { name: 'Your order' })).toBeVisible()
  await expect(page.getByText('Amina Gadgets').first()).toBeVisible()
})
