import { api } from './client'

/** The seller terms a new store accepts (backend SELLER_TERMS_VERSION in app/models/user.py). */
export const SELLER_TERMS_VERSION = '2026-11'

export interface CloseBlockers {
  canClose: boolean
  openOrders: string[]
  heldAmount: number
  unsettledPayouts: string[]
  openDisputes: string[]
}

/** POST /account/store (backend #334): name the store and accept the terms; 409 already has one. */
export async function startSelling(input: { shopName: string; shopArea?: string }) {
  await api.post('/account/store', {
    body: {
      shop_name: input.shopName.trim(),
      shop_area: input.shopArea?.trim() || null,
      terms_version: SELLER_TERMS_VERSION,
    },
  })
}

/** GET /account/store/close-check: what must finish before the store can close. */
export async function getCloseCheck(signal?: AbortSignal): Promise<CloseBlockers> {
  const r = await api.get('/account/store/close-check', { signal })
  return {
    canClose: r.can_close,
    openOrders: r.open_orders,
    heldAmount: Number(r.held_amount),
    unsettledPayouts: r.unsettled_payouts,
    openDisputes: r.open_disputes,
  }
}

/** POST /account/store/close: 409 while something must finish first (read close-check again). */
export async function closeStore() {
  await api.post('/account/store/close', {})
}

export async function reopenStore() {
  await api.post('/account/store/reopen', {})
}
