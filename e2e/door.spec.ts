import { expect, test, type Page } from '@playwright/test'
import { orderAtTheDoor } from './support'

async function inspectFromTracker(buyer: Page, orderId: string) {
  await buyer.goto(`/order/${orderId}`)
  await expect(buyer.getByRole('heading', { name: 'Your item has arrived' })).toBeVisible()
  await buyer.getByRole('button', { name: 'Inspect and confirm' }).click()
  await expect(buyer.getByRole('heading', { name: 'Inspect before you confirm' })).toBeVisible()
}

async function enterCode(buyer: Page, code: string) {
  await buyer.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  await buyer.keyboard.type(code)
  await buyer.getByRole('button', { name: 'Accept item' }).click()
  await buyer.getByRole('button', { name: 'Yes, accept' }).click()
}

test('accepting a standard item releases payment to the seller', async ({ browser, baseURL }) => {
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId, code } = await orderAtTheDoor(sellerContext, buyerContext, baseURL ?? '', false)
  const buyer = await buyerContext.newPage()

  await inspectFromTracker(buyer, orderId)
  await expect(buyer.getByText('Accepting is final and releases payment to the seller.')).toBeVisible()
  await expect(buyer.locator('body')).not.toContainText(code)

  await enterCode(buyer, '000000')
  await expect(buyer.getByText("That code doesn't match. Check the SMS and try again.")).toBeVisible()
  await enterCode(buyer, code)
  await expect(buyer.getByRole('heading', { name: 'All done' })).toBeVisible()

  await buyer.getByRole('button', { name: 'Track my order' }).click()
  await expect(buyer.getByRole('heading', { name: 'All done' })).toBeVisible()
  await expect(buyer.getByText('Complete, seller paid').first()).toBeVisible()
})

test('accepting a serial-numbered item holds payment for 24 hours', async ({ browser, baseURL }) => {
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId, code } = await orderAtTheDoor(sellerContext, buyerContext, baseURL ?? '', true)
  const buyer = await buyerContext.newPage()

  await inspectFromTracker(buyer, orderId)
  await expect(buyer.getByRole('checkbox', { name: 'Serial number matches ••••1234' })).toBeAttached()
  await enterCode(buyer, code)
  await expect(buyer.getByRole('heading', { name: 'Held for 24 hours. Test your item.' })).toBeVisible()
  await expect(buyer.getByRole('timer', { name: /Time left to report/ })).toBeVisible()

  await buyer.goto(`/order/${orderId}`)
  await expect(buyer.getByRole('heading', { name: 'Funds held for 24 hours' })).toBeVisible()
  await expect(buyer.getByRole('button', { name: 'Report a problem' })).toBeVisible()
})

test('rejecting at the door refunds the buyer and tells the seller why', async ({ browser, baseURL }) => {
  const sellerContext = await browser.newContext()
  const buyerContext = await browser.newContext()
  const { orderId } = await orderAtTheDoor(sellerContext, buyerContext, baseURL ?? '', false)
  const buyer = await buyerContext.newPage()

  await inspectFromTracker(buyer, orderId)
  await buyer.getByRole('button', { name: "Item isn't right, reject" }).click()
  await buyer.getByRole('dialog', { name: "What's wrong?" }).getByText('Wrong item', { exact: true }).click()
  await expect(buyer.getByRole('radio', { name: /Wrong item/ })).toBeChecked()
  await buyer.getByLabel("Tell the seller what's wrong (optional)").fill("It's a size 40.")
  await buyer.getByRole('button', { name: 'Confirm rejection' }).click()
  await expect(buyer.getByRole('heading', { name: 'The item is going back to the seller' })).toBeVisible()

  await buyer.goto(`/order/${orderId}`)
  await expect(buyer.getByRole('heading', { name: 'Your refund is on its way' })).toBeVisible()
  await buyer.getByRole('tab', { name: 'Timeline' }).click()
  await expect(buyer.getByText('Rejected at the door')).toBeVisible()

  const sellerNotes = (await (await sellerContext.request.get('/api/notifications')).json()) as {
    event_type: string
    message: string
  }[]
  expect(sellerNotes.find((n) => n.event_type === 'otp_withheld')?.message).toContain(
    "Reason: Wrong item. Note: It's a size 40.",
  )
})
