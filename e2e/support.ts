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

/** Simulated rail: report the STK result for a transaction (0 is success, 1032 cancelled). */
export async function mpesaCallback(api: APIRequestContext, transactionId: string, resultCode: number) {
  const response = await api.post('/api/transactions/payment-callback', {
    data: { transaction_id: transactionId, result_code: resultCode },
  })
  if (response.status() >= 400) throw new Error(`callback ${response.status()}: ${await response.text()}`)
}
