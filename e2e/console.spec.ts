import { expect, test } from '@playwright/test'
import { csrfHeader, returnOnItsWay } from './support'

test.use({ viewport: { width: 1280, height: 900 }, isMobile: false, hasTouch: false })

test('support resolves an escalated return from the console and the buyer is refunded', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(150_000)
  const phone = process.env.E2E_ADMIN_PHONE
  const password = process.env.E2E_ADMIN_PASSWORD
  test.skip(
    !phone || !password,
    'needs E2E_ADMIN_PHONE and E2E_ADMIN_PASSWORD (python -m app.cli create-admin)',
  )

  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId } = await returnOnItsWay(sellerContext, buyerContext, baseURL ?? '')
  const seller = await csrfHeader(sellerContext)
  for (const [path, data] of [
    ['seller-received', undefined],
    ['escalate', { reason: 'The returned phone has a cracked back that was not there before.' }],
  ] as const) {
    const response = await sellerContext.request.post(`/api/transactions/${orderId}/${path}`, {
      headers: seller,
      data,
    })
    expect(response.ok(), `${path} ${response.status()}`).toBe(true)
  }
  const { reference } = (await (await buyerContext.request.get(`/api/transactions/${orderId}`)).json()) as {
    reference: string
  }

  // A1: log in to the console.
  const admin = await (await browser.newContext({ viewport: { width: 1280, height: 900 } })).newPage()
  await admin.goto('/admin/login')
  await admin.getByLabel('Phone number').fill((phone ?? '').replace(/^\+254/, ''))
  await admin.getByLabel('Password', { exact: true }).fill(password ?? '')
  await admin.getByRole('button', { name: 'Log in' }).click()
  await expect(admin.getByRole('heading', { name: 'Escalation queue' })).toBeVisible()

  // A2 -> A3: open the case and refund the buyer.
  await admin.getByRole('link', { name: new RegExp(`Open case .* for ${reference}`) }).click()
  await admin.getByRole('radio', { name: /Refund buyer/ }).check()
  await admin
    .getByLabel('Reason for the decision')
    .fill('The buyer returned the item as received; the damage claim is not supported by the timeline.')
  await admin.getByRole('button', { name: 'Review decision' }).click()
  const dialog = admin.getByRole('alertdialog')
  const caseId =
    ((await dialog.getByText(/^Type D-[A-Z0-9]{4} to confirm$/).textContent()) ?? '').split(' ')[1] ?? ''
  await dialog.getByLabel(/Type .* to confirm/).fill(caseId)
  await dialog.getByRole('button', { name: 'Confirm and execute' }).click()
  await expect(admin.getByText('Decision recorded. Payouts are on their way.', { exact: true })).toBeVisible()

  // B3: the buyer sees the refund.
  const buyer = await buyerContext.newPage()
  await buyer.goto(`/order/${orderId}`)
  await expect(buyer.getByText('Refund issued').first()).toBeVisible()
})
