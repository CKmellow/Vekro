import { z } from 'zod'
import { isValidNational, PHONE_ERROR } from '@/lib/phone'

export const AREAS = [
  'Kilimani, Nairobi',
  'Westlands, Nairobi',
  'Nairobi CBD',
  'Kasarani, Nairobi',
  'Embakasi, Nairobi',
  'Thika',
  'Nakuru',
  'Kisumu',
  'Mombasa',
  'Eldoret',
  'Other',
] as const

/** S3: step 1 "Your shop" and step 2 "Get paid". The numbers must match. */
export const payoutSetupSchema = z
  .object({
    shopName: z
      .string()
      .trim()
      .min(2, 'Enter the name buyers will see')
      .max(80, 'Keep it under 80 characters'),
    area: z.enum(AREAS, { error: 'Pick your city or area' }),
    description: z.string().trim().max(160, 'Keep it under 160 characters'),
    mpesaPhone: z.string().refine(isValidNational, PHONE_ERROR),
    confirmPhone: z.string(),
    mpesaAccountName: z.string().trim().min(2, 'Enter the name on your M-Pesa account').max(120),
  })
  .refine((v) => v.mpesaPhone === v.confirmPhone, {
    path: ['confirmPhone'],
    message: "The numbers don't match. Check the last digits.",
  })

export type PayoutSetupValues = z.infer<typeof payoutSetupSchema>
export const SHOP_FIELDS = ['shopName', 'area', 'description'] as const
