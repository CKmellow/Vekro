import { compressImage } from '@/lib/image'
import type { SentCode } from './auth'
import { photoUrl } from './adapters/listings'
import { api, type Schemas } from './client'

/** The signed-in seller's shop and payout details (backend #205). Their own, so the phone is unmasked here. */
export interface SellerProfile {
  name: string
  shopName: string
  shopArea: string
  shopAbout: string
  logoUrl: string | null
  /** E.164. Where payouts go. */
  mpesaPhone: string
  mpesaAccountName: string
  /** Before the first order a new payout number needs no SMS code. */
  hasOrders: boolean
}

export function toSellerProfile(raw: Schemas['SellerProfileResponse']): SellerProfile {
  return {
    name: raw.name,
    shopName: raw.shop_name ?? '',
    shopArea: raw.shop_area ?? '',
    shopAbout: raw.shop_about ?? '',
    logoUrl: raw.logo_url ? photoUrl(raw.logo_url) : null,
    mpesaPhone: raw.mpesa_phone,
    mpesaAccountName: raw.mpesa_account_name ?? '',
    hasOrders: raw.has_orders,
  }
}

export interface ShopDetails {
  shopName: string
  shopArea: string
  shopAbout: string
}

export const getSellerProfile = async (signal?: AbortSignal) =>
  toSellerProfile(await api.get('/me/profile', { signal }))

export const updateShopDetails = async (details: ShopDetails) =>
  toSellerProfile(
    await api.patch('/me/profile', {
      body: { shop_name: details.shopName, shop_area: details.shopArea, shop_about: details.shopAbout },
    }),
  )

/** Shrunk to 512px on the device first (the server takes at most 1 MB). */
export const uploadLogo = async (file: File) =>
  toSellerProfile(
    await api.uploadPut('/me/profile/logo', { body: await compressImage(file, { maxEdge: 512 }) }),
  )

export const removeLogo = async () => toSellerProfile(await api.delete('/me/profile/logo', {}))

export async function requestPayoutCode(mpesaPhone: string): Promise<SentCode> {
  const r = await api.post('/me/mpesa-number/request-code', { body: { mpesa_phone: mpesaPhone } })
  return {
    resendAfterSeconds: r.resend_after_seconds,
    expiresAt: r.expires_at,
    devCode: r.dev_code ?? undefined,
  }
}

/** 428 means this new number needs its SMS code first. */
export const changePayout = async (input: { mpesaPhone: string; mpesaAccountName: string; code?: string }) =>
  toSellerProfile(
    await api.put('/me/mpesa-number', {
      body: {
        mpesa_phone: input.mpesaPhone,
        mpesa_account_name: input.mpesaAccountName,
        code: input.code ?? null,
      },
    }),
  )
