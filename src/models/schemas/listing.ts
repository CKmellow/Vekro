import { z } from 'zod'
import { CATEGORIES } from '@/models/domain/listing'

/** S7 step 1, Item. Price is whole KES; the API takes up to 10 digits. */
export const itemStep = z.object({
  title: z.string().trim().min(3, 'Give your item a title').max(120, 'Keep the title under 120 characters'),
  category: z.enum(CATEGORIES, { error: 'Pick a category' }),
  description: z.string().trim().max(600, 'Keep the description under 600 characters'),
  price: z
    .number({ error: 'Enter a price in KES' })
    .int('Use whole shillings')
    .min(50, 'The lowest price is KES 50')
    .max(9_999_999_999, 'That price is too high'),
  buyerName: z.string().trim().max(60, 'Keep the name under 60 characters').optional(),
})

/** S7 step 2, Item type. Serial-numbered items need the IMEI or serial number. */
export const typeStep = z
  .object({
    isSerialized: z.boolean(),
    uniqueId: z.string().trim().max(128, 'That number is too long').optional(),
  })
  .superRefine((value, ctx) => {
    if (value.isSerialized && (value.uniqueId?.replace(/\s+/g, '').length ?? 0) < 4) {
      ctx.addIssue({ code: 'custom', path: ['uniqueId'], message: 'Enter the IMEI or serial number' })
    }
  })

/** S7 step 3, Dispute policy. Depends on the item type from step 2. */
export const policyStep = z
  .object({
    isSerialized: z.boolean(),
    doorRejectReasons: z.array(z.enum(['damaged', 'wrong_item', 'not_as_described'])),
    acceptedProblems: z.array(z.string().trim().min(1).max(60)),
    resolution: z.enum(['refund', 'repair', 'replacement']).optional(),
  })
  .superRefine((value, ctx) => {
    if (!value.isSerialized) {
      if (value.doorRejectReasons.length === 0)
        ctx.addIssue({ code: 'custom', path: ['doorRejectReasons'], message: 'Pick at least one reason' })
      return
    }
    if (value.acceptedProblems.length === 0 || !value.resolution) {
      ctx.addIssue({
        code: 'custom',
        path: [value.acceptedProblems.length === 0 ? 'acceptedProblems' : 'resolution'],
        message: 'Serial-numbered listings need a policy before you can publish.',
      })
    }
  })

/** S7 step 4, Review: the whole draft must pass every step before Publish. */
export const listingDraft = z
  .object({
    item: itemStep,
    type: typeStep,
    policy: policyStep,
  })
  .superRefine((draft, ctx) => {
    if (draft.policy.isSerialized !== draft.type.isSerialized) {
      ctx.addIssue({
        code: 'custom',
        path: ['policy'],
        message: 'Review the dispute policy for this item type',
      })
    }
  })

export type ItemStep = z.infer<typeof itemStep>
export type TypeStep = z.infer<typeof typeStep>
export type PolicyStep = z.infer<typeof policyStep>
export type ListingDraft = z.infer<typeof listingDraft>
