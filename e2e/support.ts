import { request, type APIRequestContext, type BrowserContext } from '@playwright/test'

export const PASSWORD = 'Mango2026'

/** A Kenyan mobile number no earlier run used: 7 or 1, then 8 digits. */
export function freshPhone(prefix: '7' | '1' = '7'): string {
  return `${prefix}${String(Date.now()).slice(-6)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`
}

/** Registers and logs in through the API inside a browser context, so its pages share the session. */
export async function signUpVia(
  context: BrowserContext,
  role: 'seller' | 'buyer',
  name: string,
  national: string,
) {
  const phone = `+254${national}`
  const api = context.request
  const registered = await api.post('/api/auth/register', {
    data: { name, phone, password: PASSWORD, role, mpesa_phone: phone, mpesa_account_name: name },
  })
  if (!registered.ok()) throw new Error(`register ${registered.status()}: ${await registered.text()}`)
  const login = await api.post('/api/auth/login', { data: { phone, password: PASSWORD } })
  if (!login.ok()) throw new Error(`login ${login.status()}`)
}

/** The payment provider: no session cookies, like a real M-Pesa callback. */
export async function provider(baseURL: string): Promise<APIRequestContext> {
  return request.newContext({ baseURL })
}

/**
 * Simulated rail: report the STK result for a transaction (0 is success, 1032 cancelled). Sends the
 * shared secret when the backend has one (PAYMENT_CALLBACK_SECRET, backend issue #164).
 */
export async function mpesaCallback(api: APIRequestContext, transactionId: string, resultCode: number) {
  const secret = process.env.PAYMENT_CALLBACK_SECRET
  const response = await api.post('/api/transactions/payment-callback', {
    data: { transaction_id: transactionId, result_code: resultCode },
    headers: secret ? { 'X-Payment-Callback-Secret': secret } : {},
  })
  if (response.status() >= 400) throw new Error(`callback ${response.status()}: ${await response.text()}`)
}

/** The CSRF cookie value, sent as the header on unsafe API calls. */
export async function csrfHeader(context: BrowserContext): Promise<Record<string, string>> {
  const token = (await context.cookies()).find((c) => c.name === 'vekro_csrf')?.value ?? ''
  return { 'X-CSRF-Token': token }
}

const STANDARD = {
  title: 'Nike Air Force 1, size 42',
  description: '',
  price: '6500',
  is_serialized: false,
  dispute_policy: { door_reject_reasons: ['damaged', 'wrong_item', 'not_as_described'] },
}
const SERIALIZED = {
  title: 'iPhone 13, 128GB, Midnight',
  description: '',
  price: '52000',
  is_serialized: true,
  unique_id: '352098114371234',
  dispute_policy: {
    accepted_problems: ["Won't power on", 'Screen or touch problem'],
    resolution: 'repair',
    allowed_seller_actions: ['repair_shipped', 'refund_issued'],
  },
}

/** The seller lists, the buyer orders and M-Pesa confirms: the order is locked (paid, in escrow). */
export async function paidOrder(
  sellerContext: BrowserContext,
  buyerContext: BrowserContext,
  baseURL: string,
  serialized: boolean,
): Promise<{ orderId: string; reference: string }> {
  await signUpVia(sellerContext, 'seller', 'Amina Gadgets', freshPhone('1'))
  await signUpVia(buyerContext, 'buyer', 'Wanjiku Kamau', freshPhone())
  const listing = await (
    await sellerContext.request.post('/api/listings', {
      data: serialized ? SERIALIZED : STANDARD,
      headers: await csrfHeader(sellerContext),
    })
  ).json()
  const created = await (
    await buyerContext.request.post('/api/transactions', {
      data: { listing_id: listing.id },
      headers: await csrfHeader(buyerContext),
    })
  ).json()
  await mpesaCallback(await provider(baseURL), created.id, 0)
  return { orderId: created.id as string, reference: created.reference as string }
}

/** The delivery code from the buyer's own notifications, as the buyer would read it in the SMS. */
export async function deliveryCode(buyerContext: BrowserContext, orderId: string): Promise<string> {
  const notifications = (await (await buyerContext.request.get('/api/notifications')).json()) as {
    transaction_id: string
    payload?: { delivery_code?: string }
  }[]
  const code = notifications.find((n) => n.transaction_id === orderId && n.payload?.delivery_code)?.payload
    ?.delivery_code
  if (!code) throw new Error('no delivery code in the buyer notifications')
  return code
}

/**
 * A paid order with the item at the buyer's door: paid, then the seller dispatches and marks arrival.
 * Returns the order id and the buyer's delivery code.
 */
export async function orderAtTheDoor(
  sellerContext: BrowserContext,
  buyerContext: BrowserContext,
  baseURL: string,
  serialized: boolean,
): Promise<{ orderId: string; code: string }> {
  const { orderId } = await paidOrder(sellerContext, buyerContext, baseURL, serialized)
  const seller = await csrfHeader(sellerContext)
  for (const step of ['dispatch', 'arrival']) {
    const moved = await sellerContext.request.post(`/api/transactions/${orderId}/${step}`, {
      headers: seller,
    })
    if (!moved.ok()) throw new Error(`${step} ${moved.status()}`)
  }
  return { orderId, code: await deliveryCode(buyerContext, orderId) }
}
