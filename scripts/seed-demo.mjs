// Demo data for the defense and local work (M17 #136), using the PAGES.md 0.1 sample data.
// Drives the real API, so every order has the same escrow and ledger state a real one would.
//
//   1. Fresh database: (backend) .venv/bin/alembic upgrade head, then start the API.
//   2. Support admin:  (backend) VEKRO_ADMIN_PASSWORD=... python -m app.cli create-admin --phone 0700000103
//   3. node scripts/seed-demo.mjs            (API=http://127.0.0.1:8000, DEMO_PASSWORD=demo-pass-123)
//
// The simulated M-Pesa rail must be on (the default in development). Run it once per database.
const API = process.env.API ?? 'http://127.0.0.1:8000'
const PASSWORD = process.env.DEMO_PASSWORD ?? 'demo-pass-123'
const CALLBACK_SECRET = process.env.PAYMENT_CALLBACK_SECRET

class Client {
  cookies = new Map()
  async call(method, path, body) {
    const headers = { Accept: 'application/json' }
    if (body !== undefined) headers['Content-Type'] = 'application/json'
    if (method !== 'GET') headers['X-CSRF-Token'] = this.cookies.get('vekro_csrf') ?? ''
    if (path === '/transactions/payment-callback' && CALLBACK_SECRET)
      headers['X-Payment-Callback-Secret'] = CALLBACK_SECRET
    if (this.cookies.size) headers.Cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ')
    const res = await fetch(API + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    for (const cookie of res.headers.getSetCookie()) {
      const [pair] = cookie.split(';')
      const i = pair.indexOf('=')
      this.cookies.set(pair.slice(0, i), pair.slice(i + 1))
    }
    const text = await res.text()
    if (!res.ok)
      throw Object.assign(new Error(`${method} ${path}: ${res.status} ${text}`), { status: res.status })
    return text ? JSON.parse(text) : null
  }
  get = (path) => this.call('GET', path)
  post = (path, body) => this.call('POST', path, body)
  patch = (path, body) => this.call('PATCH', path, body)
}

/** Registers the account, or logs in if it already exists. */
async function account(role, name, phone) {
  const client = new Client()
  try {
    await client.post('/auth/register', {
      name,
      phone,
      password: PASSWORD,
      role,
      mpesa_phone: phone,
      mpesa_account_name: name.toUpperCase(),
    })
  } catch (error) {
    if (error.status !== 409) throw error
  }
  await client.post('/auth/login', { phone, password: PASSWORD })
  return client
}

const seller = await account('seller', 'Amina Wanjiru', '+254722118904')
const brian = await account('buyer', 'Brian Otieno', '+254712345678')
const wanjiku = await account('buyer', 'Wanjiku Kamau', '+254712000222')
const provider = new Client()

await seller.patch('/me/profile', {
  shop_name: 'Amina Gadgets',
  shop_area: 'Kilimani, Nairobi',
  shop_about: 'Phones, laptops and accessories. Every item tested before it ships.',
})

const standard = (title, price, category) => ({
  title,
  description: '',
  category,
  price,
  is_serialized: false,
  dispute_policy: { door_reject_reasons: ['damaged', 'wrong_item', 'not_as_described'] },
})
const serialized = (title, price, imei, category = 'phones') => ({
  title,
  description: '',
  category,
  price,
  is_serialized: true,
  unique_id: imei,
  dispute_policy: {
    accepted_problems: ["Won't power on", 'Screen or touch problem', 'Battery drains fast'],
    resolution: 'repair',
    allowed_seller_actions: ['repair_shipped', 'refund_issued', 'replacement_shipped'],
  },
})

async function deliveryCode(buyer, id) {
  const notes = await buyer.get('/notifications')
  return notes.find((n) => n.transaction_id === id && n.payload?.delivery_code)?.payload?.delivery_code
}

/** Lists the item, has the buyer order it and walks it through the steps. */
async function order(listing, buyer, steps) {
  const created = await seller.post('/listings', listing)
  const tx = await buyer.post('/transactions', { listing_id: created.id })
  const step = {
    pay: () => provider.post('/transactions/payment-callback', { transaction_id: tx.id, result_code: 0 }),
    dispatch: () => seller.post(`/transactions/${tx.id}/dispatch`),
    arrive: () => seller.post(`/transactions/${tx.id}/arrival`),
    accept: async () =>
      buyer.post(`/transactions/${tx.id}/otp-give`, { otp_code: await deliveryCode(buyer, tx.id) }),
    report: () =>
      buyer.post(`/transactions/${tx.id}/report-functional-issue`, {
        category: 'not_working',
        description: "The screen goes black a few minutes after it's switched on.",
      }),
    sendBack: () => buyer.post(`/transactions/${tx.id}/buyer-sent-back`),
    received: () => seller.post(`/transactions/${tx.id}/seller-received`),
    escalate: () =>
      seller.post(`/transactions/${tx.id}/escalate`, {
        reason: 'The returned phone has a cracked back that was not there when it left the shop.',
      }),
  }
  for (const name of steps) await step[name]()
  return { title: listing.title, reference: tx.reference, id: tx.id }
}

const delivered = ['pay', 'dispatch', 'arrive', 'accept']
const orders = [
  // The sample order: paid, ready to dispatch (S4 "Needs your action", B3 "Paid, funds held safely").
  await order(serialized('iPhone 13, 128GB, Midnight', '52000', '352098114371234'), brian, ['pay']),
  await order(standard('Nike Air Force 1, size 42', '6500', 'fashion'), brian, ['pay', 'dispatch']),
  await order(serialized('HP Pavilion 15 laptop', '68500', '5CD1234XYZ', 'electronics'), brian, delivered),
  await order(standard('3-seater sofa', '38000', 'home'), wanjiku, []),
  await order(standard('Kitenge wrap dress', '3200', 'fashion'), wanjiku, delivered),
  // Completed sales, so S12 analytics unlocks (it needs 5).
  ...(await Promise.all(
    [
      ['Anker 20W charger', '1800'],
      ['JBL Go 3 speaker', '4500'],
      ['Phone case, iPhone 13', '900'],
      ['USB-C cable, 2 m', '700'],
      ['Wireless earbuds', '3500'],
    ].map(([title, price]) => order(standard(title, price, 'electronics'), wanjiku, delivered)),
  )),
  // A return the seller disputes: escalated to the support console (A2, A3).
  await order(serialized('Samsung Galaxy A54', '41000', '358240051234567'), brian, [
    ...delivered,
    'report',
    'sendBack',
    'received',
    'escalate',
  ]),
]
await seller.post('/listings', standard('Leather sandals', '2800', 'fashion'))

console.log(`Seeded ${orders.length} orders on ${API}. Log in with password ${'*'.repeat(PASSWORD.length)}:`)
console.log('  Seller  +254 722 118 904 (Amina Gadgets)   /login')
console.log('  Buyer   +254 712 345 678 (Brian Otieno)    /buyer/sign-in')
console.log('  Admin   the number given to app.cli create-admin   /admin/login')
for (const o of orders) console.log(`  ${o.reference}  ${o.title}`)
