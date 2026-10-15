import { gapRequest } from '../client'
import { isMocked } from './gaps'

/** Shop and payout details (backend-gap #144 P1-7: the API can only set mpesa_phone at registration). */
export interface SellerProfileInput {
  shopName: string
  area: string
  description: string
  /** Object URL of the chosen logo, mocked until listing content and profiles ship. */
  logoUrl: string | null
  /** E.164. */
  mpesaPhone: string
  mpesaAccountName: string
}

export interface SaveResult {
  /** False when the gap mock is off: the screen must say the details were not stored. */
  saved: boolean
}

export async function saveSellerProfile(input: SellerProfileInput): Promise<SaveResult> {
  if (!isMocked('SELLER_PROFILE')) return { saved: false }
  // backend-gap #144
  await gapRequest('put', '/__gaps__/seller/profile', { body: input })
  return { saved: true }
}
