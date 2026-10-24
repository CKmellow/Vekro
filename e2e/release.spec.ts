import { expect, test } from '@playwright/test'
import { deliveryCode, paidOrder } from './support'

test('a seller dispatches and marks arrival from the app, the buyer accepts, the seller is paid', async ({
  browser,
  baseURL,
}) => {
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId, reference } = await paidOrder(sellerContext, buyerContext, baseURL ?? '', false)
  const seller = await sellerContext.newPage()
  const buyer = await buyerContext.newPage()

  // S4: the paid order waits on the seller; dispatch from the dashboard card.
  await seller.goto('/seller')
  const needs = seller.getByRole('region', { name: /Needs your action/ })
  await expect(needs.getByText(`Dispatch ${reference} before the timer runs out`)).toBeVisible()
  await needs.getByRole('button', { name: `Mark as dispatched ${reference}` }).click()
  await seller.getByRole('button', { name: "Yes, it's dispatched" }).click()
  await expect(seller.getByText('Marked as dispatched').first()).toBeVisible()

  // S5: the order is still in Needs action (on the way); mark arrival from the row.
  await seller.goto('/seller/orders?segment=needs_action')
  await seller.getByRole('button', { name: `Mark arrived ${reference}` }).click()
  await seller.getByRole('button', { name: 'Yes, mark arrived' }).click()
  await expect(seller.getByText('The buyer has been asked to inspect').first()).toBeVisible()

  // S6: the buyer is inspecting.
  await seller.goto(`/seller/orders/${orderId}`)
  await expect(seller.getByRole('heading', { name: 'The buyer is inspecting' })).toBeVisible()

  // B4: the buyer accepts with the code from their SMS.
  const code = await deliveryCode(buyerContext, orderId)
  await buyer.goto(`/order/${orderId}/inspect`)
  await buyer.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  await buyer.keyboard.type(code)
  await buyer.getByRole('button', { name: 'Accept item' }).click()
  await buyer.getByRole('button', { name: 'Yes, accept' }).click()
  await expect(buyer.getByRole('heading', { name: 'All done' })).toBeVisible()

  // S6 polls; reload to see it at once. Payout is released (the executor sends it later).
  await seller.reload()
  await expect(seller.getByRole('heading', { name: "You've been paid" })).toBeVisible()
  await expect(seller.getByText(/Payout in progress|Paid out to M-Pesa/)).toBeVisible()
  await expect(seller.getByText('Paid out').first()).toBeVisible()

  // S14: the seller's notifications name the order.
  await seller.goto('/seller/notifications')
  await expect(seller.getByText(reference).first()).toBeVisible()
})
