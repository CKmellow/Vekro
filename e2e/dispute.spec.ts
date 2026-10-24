import { expect, test } from '@playwright/test'
import { csrfHeader, orderAtTheDoor } from './support'

test('a buyer reports a fault, returns the item, the seller repairs it and the buyer confirms', async ({
  browser,
  baseURL,
}) => {
  test.setTimeout(150_000)
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId, code } = await orderAtTheDoor(sellerContext, buyerContext, baseURL ?? '', true)
  const buyer = await buyerContext.newPage()
  const seller = await csrfHeader(sellerContext)
  const sellerStep = async (path: string, data?: object) => {
    const response = await sellerContext.request.post(`/api/transactions/${orderId}/${path}`, {
      headers: seller,
      data,
    })
    expect(response.ok(), `${path} ${response.status()}`).toBe(true)
  }

  // B4: accept a serial-numbered item; payment is held for 24 hours.
  await buyer.goto(`/order/${orderId}/inspect`)
  await buyer.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  await buyer.keyboard.type(code)
  await buyer.getByRole('button', { name: 'Accept item' }).click()
  await buyer.getByRole('button', { name: 'Yes, accept' }).click()
  await expect(buyer.getByRole('heading', { name: 'Held for 24 hours. Test your item.' })).toBeVisible()

  // B3 -> B5: report a problem.
  await buyer.goto(`/order/${orderId}`)
  await buyer.getByRole('button', { name: 'Report a problem' }).click()
  await expect(buyer.getByRole('heading', { name: "What's wrong with your item?" })).toBeVisible()
  await buyer.getByRole('radio', { name: "It doesn't work properly" }).check()
  await buyer.getByLabel("What's happening?").fill('The screen flickers and goes black after a few minutes.')
  await buyer.getByRole('checkbox', { name: 'I understand I need to send the item back.' }).check()
  await buyer.getByRole('button', { name: 'Submit report' }).click()
  await expect(buyer.getByRole('heading', { name: "We've told the seller" })).toBeVisible()

  // B6: send it back.
  await buyer.getByRole('button', { name: 'Next: send the item back' }).click()
  await expect(buyer.getByRole('heading', { name: 'Send the item back' })).toBeVisible()
  await expect(buyer.getByText("Doesn't work properly")).toBeVisible()
  await buyer.getByRole('button', { name: "I've sent it back" }).click()
  await buyer.getByRole('button', { name: "Yes, it's on its way" }).click()
  await expect(buyer.getByRole('heading', { name: 'On its way back' })).toBeVisible()

  // The seller confirms receipt and sends a repair (S11 arrives in M12).
  await sellerStep('seller-received')
  await sellerStep('seller-resolution-action', { action: 'repair_shipped', notes: 'Replaced the screen.' })

  // B6: is it fixed? Yes.
  await buyer.reload()
  await expect(buyer.getByRole('heading', { name: 'Is it fixed?' })).toBeVisible()
  await expect(buyer.getByText('"Replaced the screen."')).toBeVisible()
  await buyer.getByRole('button', { name: "Yes, it's fixed" }).click()
  await buyer.getByRole('button', { name: 'Yes, it works' }).click()
  await expect(buyer.getByRole('heading', { name: 'Sorted' })).toBeVisible()
  await expect(buyer.getByText('You: not yet')).toBeVisible()

  // Closure: the buyer marks it resolved; the seller's side is still waiting.
  await buyer.getByRole('button', { name: 'Mark as resolved' }).click()
  await expect(buyer.getByText('You: confirmed')).toBeVisible()
  await expect(buyer.getByText('Seller: waiting')).toBeVisible()
})
