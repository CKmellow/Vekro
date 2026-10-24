import { expect, test, type Page } from '@playwright/test'
import { returnOnItsWay } from './support'

async function receiveFromInbox(seller: Page, orderId: string) {
  await seller.goto('/seller/returns')
  await seller.locator(`a[href="/seller/returns/${orderId}"]`).click()
  await expect(seller.getByRole('heading', { name: 'Waiting for the item to arrive' })).toBeVisible()
  await expect(seller.getByText("Doesn't work properly")).toBeVisible()
  await seller.getByRole('button', { name: 'I received the item' }).first().click()
  await seller.getByRole('button', { name: 'Yes, I have it' }).click()
  await expect(seller.getByRole('heading', { name: 'Choose your resolution' })).toBeVisible()
}

test('a seller receives a return and refunds the buyer', async ({ browser, baseURL }) => {
  test.setTimeout(150_000)
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId } = await returnOnItsWay(sellerContext, buyerContext, baseURL ?? '')
  const seller = await sellerContext.newPage()

  await receiveFromInbox(seller, orderId)
  await seller.getByRole('radio', { name: /Refund buyer/ }).check()
  await seller.getByRole('button', { name: 'Confirm action' }).first().click()
  await expect(seller.getByRole('alertdialog', { name: /Refund KES 52,000 to the buyer\?/ })).toBeVisible()
  await seller.getByRole('button', { name: 'Refund buyer', exact: true }).click()
  await expect(seller.getByRole('heading', { name: 'Refund issued' })).toBeVisible()
})

test('a seller repairs a returned item and the buyer confirms it works', async ({ browser, baseURL }) => {
  test.setTimeout(150_000)
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId } = await returnOnItsWay(sellerContext, buyerContext, baseURL ?? '')
  const seller = await sellerContext.newPage()
  const buyer = await buyerContext.newPage()

  await receiveFromInbox(seller, orderId)
  await seller.getByRole('radio', { name: /Repair and send back/ }).check()
  await seller.getByLabel('Note for the buyer (optional)').fill('New screen fitted. Sent with G4S.')
  await seller.getByRole('button', { name: 'Confirm action' }).first().click()
  await expect(
    seller.getByRole('heading', { name: "Waiting for the buyer to confirm it's fixed" }),
  ).toBeVisible()

  await buyer.goto(`/order/${orderId}/return`)
  await expect(buyer.getByText('"New screen fitted. Sent with G4S."')).toBeVisible()
  await buyer.getByRole('button', { name: "Yes, it's fixed" }).click()
  await buyer.getByRole('button', { name: 'Yes, it works' }).click()
  await expect(buyer.getByRole('heading', { name: 'Sorted' })).toBeVisible()

  await seller.reload()
  await expect(seller.getByRole('heading', { name: 'Settled: you were paid' })).toBeVisible()
  await seller.getByRole('button', { name: 'Mark as resolved' }).click()
  await expect(seller.getByText('You: confirmed')).toBeVisible()
})
