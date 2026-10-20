import { expect, test } from '@playwright/test'
import { freshPhone, mpesaCallback, PASSWORD, provider, signUpVia } from './support'

// A 1x1 JPEG for the listing photo.
const JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==',
  'base64',
)

test('a seller lists an item and a buyer pays into escrow', async ({ browser, baseURL }) => {
  // Seller: publish a listing through the S7 wizard.
  const sellerContext = await browser.newContext()
  await signUpVia(sellerContext, 'seller', 'Amina Gadgets', freshPhone('1'))
  const seller = await sellerContext.newPage()
  await seller.goto('/seller/listings/new')
  await seller.getByLabel('Title').fill('Nike Air Force 1, size 42')
  await seller.getByLabel('Price').fill('6500')
  await seller
    .locator('input[type="file"]')
    .setInputFiles({ name: 'af1.jpg', mimeType: 'image/jpeg', buffer: JPEG })
  for (let step = 0; step < 3; step++) await seller.getByRole('button', { name: 'Next' }).first().click()
  await seller
    .getByRole('button', { name: /^Publish( and get link)?$/ })
    .first()
    .click()
  await expect(seller.getByRole('heading', { name: 'Your Trust Link is ready' })).toBeVisible()
  const listingId = new URL(seller.url()).pathname.split('/').at(-1) ?? ''
  expect(listingId).toMatch(/^[0-9a-f-]{36}$/)

  // Buyer: open the Trust Link, save details and pay (B1).
  const buyerContext = await browser.newContext()
  const buyer = await buyerContext.newPage()
  await buyer.goto(`/pay/${listingId}`)
  await expect(buyer.getByRole('heading', { level: 1, name: 'Nike Air Force 1, size 42' })).toBeVisible()
  await expect(buyer.getByRole('img', { name: 'Nike Air Force 1, size 42' })).toBeVisible()
  await expect(buyer.getByText('Amina Gadgets', { exact: true })).toBeVisible()
  await buyer.getByLabel('M-Pesa phone number').fill(freshPhone())
  await buyer.getByLabel('Your name').fill('Wanjiku Kamau')
  await buyer.getByLabel('Create a password', { exact: true }).fill(PASSWORD)
  await buyer.getByRole('checkbox').check()
  await buyer.getByRole('button', { name: /Pay KES 6,500 with M-Pesa/ }).click()

  // B2: waiting for the PIN, then M-Pesa confirms.
  await expect(
    buyer.getByRole('heading', { name: 'Check your phone and enter your M-Pesa PIN' }),
  ).toBeVisible()
  const orderId = buyer.url().match(/\/order\/([0-9a-f-]{36})\/payment$/)?.[1] ?? ''
  expect(orderId).not.toBe('')
  await expect(buyer.getByText(/^VK-[A-Z0-9]{6}$/).first()).toBeVisible()

  const mpesa = await provider(baseURL ?? '')
  await mpesaCallback(mpesa, orderId, 0)
  await expect(buyer.getByRole('heading', { name: 'Payment received' })).toBeVisible()
  await expect(buyer.getByText('Paid, funds held safely')).toBeVisible()

  // The tracker shows the order paid and waiting for dispatch.
  await buyer.getByRole('button', { name: 'Track my order' }).click()
  await expect(buyer.getByRole('heading', { name: 'Waiting for the seller to dispatch' })).toBeVisible()
  await expect(buyer.getByText('Paid, funds held safely').first()).toBeVisible()

  // The Trust Link now says the item is paid for.
  const other = await (await browser.newContext()).newPage()
  await other.goto(`/pay/${listingId}`)
  await expect(other.getByText('This item has already been paid for')).toBeVisible()
  await expect(other.getByRole('button', { name: /Pay KES/ })).toHaveCount(0)
})

test('a cancelled prompt explains itself and nothing is charged', async ({ browser, baseURL }) => {
  const sellerContext = await browser.newContext()
  await signUpVia(sellerContext, 'seller', 'Amina Gadgets', freshPhone('1'))
  const csrf = (await sellerContext.cookies()).find((c) => c.name === 'vekro_csrf')?.value ?? ''
  const listing = await (
    await sellerContext.request.post('/api/listings', {
      data: {
        title: 'Kitenge wrap dress',
        description: '',
        price: '3200',
        is_serialized: false,
        dispute_policy: {},
      },
      headers: { 'X-CSRF-Token': csrf },
    })
  ).json()

  const buyerContext = await browser.newContext()
  await signUpVia(buyerContext, 'buyer', 'Wanjiku Kamau', freshPhone())
  const buyer = await buyerContext.newPage()
  await buyer.goto(`/pay/${listing.id}`)
  await expect(buyer.getByText('Paying as')).toBeVisible()
  await buyer.getByRole('checkbox').check()
  await buyer.getByRole('button', { name: /Pay KES 3,200 with M-Pesa/ }).click()
  await expect(
    buyer.getByRole('heading', { name: 'Check your phone and enter your M-Pesa PIN' }),
  ).toBeVisible()
  const orderId = buyer.url().match(/\/order\/([0-9a-f-]{36})\/payment$/)?.[1] ?? ''

  await mpesaCallback(await provider(baseURL ?? ''), orderId, 1032)
  await expect(buyer.getByText('You cancelled the M-Pesa request.')).toBeVisible()
  await expect(buyer.getByText('Nothing was charged.')).toBeVisible()
  await expect(buyer.getByRole('button', { name: /Try again/ })).toBeVisible()
})
