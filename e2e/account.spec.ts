import { expect, test } from '@playwright/test'
import { paidOrder } from './support'

test('a buyer finds their order in My orders and opens it by reference', async ({ browser, baseURL }) => {
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId, reference } = await paidOrder(sellerContext, buyerContext, baseURL ?? '', false)
  const buyer = await buyerContext.newPage()

  await buyer.goto('/buyer/orders')
  await expect(buyer.getByRole('heading', { name: 'My orders' })).toBeVisible()
  await expect(buyer.getByRole('link', { name: new RegExp(reference) })).toBeVisible()

  await buyer.getByRole('button', { name: 'Track an order' }).click()
  await buyer.getByLabel('Order link or reference').fill(reference.toLowerCase())
  await buyer.getByRole('button', { name: 'Open' }).click()
  await expect(buyer).toHaveURL(new RegExp(`/order/${orderId}$`))
})

test('a seller with orders changes the payout number, confirmed by an SMS code to the new number', async ({
  browser,
  baseURL,
}) => {
  const sellerContext = await browser.newContext()
  await paidOrder(sellerContext, await browser.newContext(), baseURL ?? '', false)
  const seller = await sellerContext.newPage()
  const national = `7${String(Date.now()).slice(-8)}`

  await seller.goto('/seller/settings?tab=payout')
  await seller.getByRole('button', { name: 'Change' }).click()
  await seller.getByLabel('New M-Pesa number').fill(national)
  await seller.getByLabel('Type it again').fill(national)
  const [sent] = await Promise.all([
    seller.waitForResponse((r) => r.url().endsWith('/api/me/mpesa-number/request-code')),
    seller.getByRole('button', { name: 'Send code' }).click(),
  ])
  const { dev_code: code } = (await sent.json()) as { dev_code: string }
  await seller.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  await seller.keyboard.type(code)

  await expect(seller.getByText(`+254 ${national.slice(0, 3)} *** ${national.slice(6)}`)).toBeVisible()
})
