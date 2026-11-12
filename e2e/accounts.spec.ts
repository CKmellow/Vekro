import { expect, test, type BrowserContext, type Page } from '@playwright/test'
import { csrfHeader, deliveryCode, freshPhone, mpesaCallback, provider, signUpVia } from './support'

// M21: one account buys and sells (backend docs/accounts-and-modes.md), against the real backend.

const LISTING = {
  title: 'Kiondo basket',
  description: '',
  price: '1500',
  is_serialized: false,
  dispute_policy: { door_reject_reasons: ['damaged', 'wrong_item', 'not_as_described'] },
}

async function listItem(seller: BrowserContext, title = LISTING.title): Promise<string> {
  const response = await seller.request.post('/api/listings', {
    data: { ...LISTING, title },
    headers: await csrfHeader(seller),
  })
  expect(response.ok(), await response.text()).toBe(true)
  return ((await response.json()) as { id: string }).id
}

async function buy(buyer: BrowserContext, listingId: string) {
  return buyer.request.post('/api/transactions', {
    data: { listing_id: listingId },
    headers: await csrfHeader(buyer),
  })
}

async function paidFor(buyer: BrowserContext, listingId: string, baseURL: string) {
  const created = await buy(buyer, listingId)
  expect(created.ok(), await created.text()).toBe(true)
  const order = (await created.json()) as { id: string; reference: string }
  await mpesaCallback(await provider(baseURL), order.id, 0)
  return order
}

/** Types the SMS code the dev echo returned for the request this click sends. */
async function sendAndTypeCode(page: Page, button: string, endpoint: string) {
  const [sent] = await Promise.all([
    page.waitForResponse((r) => r.url().endsWith(endpoint)),
    page.getByRole('button', { name: button }).click(),
  ])
  const { dev_code: code } = (await sent.json()) as { dev_code: string | null }
  expect(code, 'set PHONE_CODE_DEV_ECHO=true on the backend').toMatch(/^\d{6}$/)
  await page.getByRole('textbox', { name: 'Digit 1 of 6' }).click()
  await page.keyboard.type(code ?? '')
}

test('a buyer signs in with an SMS code, sees Home, then Orders', async ({ browser, baseURL }) => {
  const seller = await browser.newContext()
  await signUpVia(seller, 'seller', 'Wanjiru Kamau', freshPhone('1'))
  const listingId = await listItem(seller)
  const national = freshPhone()
  const setup = await browser.newContext()
  await signUpVia(setup, 'buyer', 'Amina Otieno', national)
  await paidFor(setup, listingId, baseURL ?? '')

  const page = await (await browser.newContext()).newPage()
  await page.goto('/login?method=code')
  await page.getByLabel('Phone number').fill(national)
  await sendAndTypeCode(page, 'Send code', '/api/auth/phone/request-code')
  await expect(page).toHaveURL(/\/buyer$/)
  await expect(page.getByRole('heading', { name: 'Hi, Amina' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Recent orders' })).toBeVisible()

  await page.getByRole('navigation', { name: 'Buyer' }).getByRole('link', { name: 'Orders' }).click()
  await expect(page.getByRole('heading', { name: 'Orders', exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: /Kiondo basket/ })).toBeVisible()
})

test('a buyer opens a store and switches between buying and selling', async ({ browser }) => {
  const context = await browser.newContext()
  await signUpVia(context, 'buyer', 'Brian Mwangi', freshPhone())
  const page = await context.newPage()
  await page.goto('/buyer')
  await page.getByRole('link', { name: /Sell on Vekro too/ }).click()

  await page.getByLabel('Store name').fill('Brian Sneakers')
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Open my store' }).click()
  await expect(page.getByLabel('M-Pesa payout number')).toBeVisible()
  await sendAndTypeCode(page, 'Text me a code', '/api/me/mpesa-number/request-code')
  await expect(page).toHaveURL(/\/seller\/listings\/new/)

  // The phone shell: the switch lives in More.
  await page.goto('/seller')
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByRole('dialog', { name: 'More' }).getByText('Buying', { exact: true }).click()
  await expect(page).toHaveURL(/\/buyer$/)
  await page.getByRole('button', { name: 'More' }).click()
  await page.getByRole('dialog', { name: 'More' }).getByText('Selling', { exact: true }).click()
  await expect(page).toHaveURL(/\/seller$/)
})

test('a seller buys from another shop, and the purchase shows under Buying', async ({ browser, baseURL }) => {
  const other = await browser.newContext()
  await signUpVia(other, 'seller', 'Juma Shoes', freshPhone('1'))
  const theirs = await listItem(other, 'Leather sandals')

  const seller = await browser.newContext()
  await signUpVia(seller, 'seller', 'Wanjiru Kamau', freshPhone('1'))
  const { reference } = await paidFor(seller, theirs, baseURL ?? '')

  const page = await seller.newPage()
  await page.goto('/buyer/orders')
  await expect(page.getByRole('link', { name: new RegExp(reference) })).toBeVisible()
  // Not among the store's sales.
  const sales = await seller.request.get('/api/transactions?as=selling')
  expect(((await sales.json()) as { items: unknown[] }).items).toHaveLength(0)
})

test("a seller can't buy from their own store", async ({ browser }) => {
  const seller = await browser.newContext()
  await signUpVia(seller, 'seller', 'Wanjiru Kamau', freshPhone('1'))
  const mine = await listItem(seller)

  const page = await seller.newPage()
  await page.goto(`/pay/${mine}`)
  await expect(page.getByText('This is your own listing')).toBeVisible()
  await expect(page.getByRole('button', { name: /Pay KES/ })).toHaveCount(0)

  const refused = await buy(seller, mine)
  expect(refused.status()).toBe(422)
  expect(await refused.json()).toEqual({ detail: "You can't buy from your own store." })
})

test('closing a store is blocked while an order is open, then succeeds', async ({ browser, baseURL }) => {
  test.setTimeout(180_000)
  const seller = await browser.newContext()
  await signUpVia(seller, 'seller', 'Wanjiru Kamau', freshPhone('1'))
  const listingId = await listItem(seller)
  const buyer = await browser.newContext()
  await signUpVia(buyer, 'buyer', 'Amina Otieno', freshPhone())
  const { id: orderId, reference } = await paidFor(buyer, listingId, baseURL ?? '')

  const page = await seller.newPage()
  await page.goto('/seller/settings')
  await page.getByRole('button', { name: 'Close store' }).click()
  const blocked = page.getByRole('alertdialog', { name: 'Finish these first' })
  await expect(blocked.getByRole('link', { name: reference })).toBeVisible()
  await blocked.getByRole('button', { name: 'OK' }).click()

  // The buyer rejects at the door: the money goes back and nothing needs the seller any more.
  const headers = await csrfHeader(seller)
  for (const step of ['dispatch', 'arrival']) {
    const moved = await seller.request.post(`/api/transactions/${orderId}/${step}`, { headers })
    expect(moved.ok(), `${step} ${moved.status()}`).toBe(true)
  }
  await deliveryCode(buyer, orderId)
  const rejected = await buyer.request.post(`/api/transactions/${orderId}/otp-withhold`, {
    data: { reason: 'damaged' },
    headers: await csrfHeader(buyer),
  })
  expect(rejected.ok(), await rejected.text()).toBe(true)

  await expect
    .poll(
      async () =>
        (
          (await (await seller.request.get('/api/account/store/close-check')).json()) as {
            can_close: boolean
          }
        ).can_close,
      // The scheduler sends the refund within its 30 s payout cycle.
      { timeout: 75_000 },
    )
    .toBe(true)
  await page.reload()
  await page.getByRole('button', { name: 'Close store' }).click()
  const confirm = page.getByRole('alertdialog', { name: 'Close your store?' })
  await confirm.getByRole('button', { name: 'Close store' }).click()
  await expect(page.getByRole('button', { name: 'Reopen store' })).toBeVisible()

  // The Trust Link says so.
  const visitor = await (await browser.newContext()).newPage()
  await visitor.goto(`/pay/${listingId}`)
  await expect(visitor.getByText('This store is closed')).toBeVisible()
})
