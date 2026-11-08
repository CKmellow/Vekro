import { expect, test } from '@playwright/test'
import { freshPhone, signUpVia } from './support'

// Card payments go through Pesapal's hosted page. The backend is real and talks to Pesapal's
// sandbox (CI sets PESAPAL_* with the public demo keys and registers an IPN); only the browser's
// trip to Pesapal is stubbed: the stub sends the buyer straight back, as if they closed the page
// without paying. The return page must then keep confirming and never claim success.
test.skip(!process.env.E2E_CARD, 'Card e2e needs a backend with Pesapal configured (E2E_CARD=1).')

test("a card buyer leaves for Pesapal's page and comes back to a page that never trusts the redirect", async ({
  browser,
  baseURL,
}) => {
  const sellerContext = await browser.newContext()
  await signUpVia(sellerContext, 'seller', 'Amina Gadgets', freshPhone('1'))
  const csrf = (await sellerContext.cookies()).find((c) => c.name === 'vekro_csrf')?.value ?? ''
  const listing = await (
    await sellerContext.request.post('/api/listings', {
      data: { title: 'Kiondo basket', description: '', price: '1', is_serialized: false, dispute_policy: {} },
      headers: { 'X-CSRF-Token': csrf },
    })
  ).json()

  const buyerContext = await browser.newContext()
  await signUpVia(buyerContext, 'buyer', 'Wanjiku Kamau', freshPhone())
  const buyer = await buyerContext.newPage()

  // Pass the real create call through unchanged, noting the order before the page leaves.
  const seen: {
    order?: { id: string; reference: string; payment_method: string; payment: { kind: string } }
  } = {}
  await buyer.route('**/api/transactions', async (route) => {
    const response = await route.fetch()
    if (route.request().method() === 'POST') seen.order = await response.json()
    await route.fulfill({ response })
  })
  let pesapalUrl = ''
  await buyer.route('https://cybqa.pesapal.com/**', async (route) => {
    pesapalUrl = route.request().url()
    await route.fulfill({
      status: 302,
      headers: {
        location: `${baseURL ?? ''}/pay/return?order=${seen.order?.id ?? ''}&OrderTrackingId=stub&OrderNotificationType=CALLBACKURL`,
      },
    })
  })

  await buyer.goto(`/pay/${listing.id}`)
  await expect(buyer.getByText('Paying as')).toBeVisible()
  await buyer.getByRole('radio', { name: /Card/ }).check()
  await expect(buyer.getByText(/leave Vekro for Pesapal's secure card page/)).toBeVisible()
  await buyer.getByRole('checkbox').check()
  await buyer.getByRole('button', { name: 'Pay KES 1 by card' }).click()

  await expect(buyer).toHaveURL(/\/pay\/return\?order=/)
  expect(pesapalUrl).toMatch(/^https:\/\/cybqa\.pesapal\.com\//)
  const order = seen.order
  expect(order).toBeDefined()
  if (!order) return
  expect(order.payment_method).toBe('card')
  expect(order.payment.kind).toBe('REDIRECT')
  await expect(buyer.getByRole('status')).toHaveText('Confirming your payment…')
  await expect(buyer.getByText(order.reference)).toBeVisible()
  // Nobody paid: whatever the URL says, it never shows success.
  await buyer.waitForTimeout(4000)
  await expect(buyer.getByRole('heading', { name: 'Payment received' })).toHaveCount(0)
})
