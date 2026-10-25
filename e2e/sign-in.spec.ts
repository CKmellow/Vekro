import { expect, test } from '@playwright/test'
import { freshPhone } from './support'

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
