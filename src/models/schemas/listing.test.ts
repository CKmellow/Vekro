import { describe, expect, it } from 'vitest'
import { itemStep, listingDraft, policyStep, typeStep } from './listing'

const item = {
  title: 'iPhone 13, 128GB, Midnight',
  category: 'Phones and tablets',
  description: '',
  price: 52000,
}

describe('listing wizard schemas', () => {
  it('step 1 accepts a valid item and rejects bad prices', () => {
    expect(itemStep.safeParse(item).success).toBe(true)
    expect(itemStep.safeParse({ ...item, price: 49 }).error?.issues[0]?.message).toBe(
      'The lowest price is KES 50',
    )
    expect(itemStep.safeParse({ ...item, price: 52000.5 }).error?.issues[0]?.message).toBe(
      'Use whole shillings',
    )
    expect(itemStep.safeParse({ ...item, category: 'Cars' }).error?.issues[0]?.message).toBe(
      'Pick a category',
    )
  })

  it('step 2 needs the IMEI or serial for serial-numbered items', () => {
    expect(typeStep.safeParse({ isSerialized: false }).success).toBe(true)
    expect(typeStep.safeParse({ isSerialized: true, uniqueId: '12' }).error?.issues[0]?.path).toEqual([
      'uniqueId',
    ])
    expect(typeStep.safeParse({ isSerialized: true, uniqueId: '35 209 811 437 1234' }).success).toBe(true)
  })

  it('step 3 needs door reasons for standard items and a full policy for serial-numbered ones', () => {
    const base = { doorRejectReasons: [], acceptedProblems: [] }
    expect(policyStep.safeParse({ ...base, isSerialized: false }).error?.issues[0]?.message).toBe(
      'Pick at least one reason',
    )
    expect(policyStep.safeParse({ ...base, isSerialized: true }).error?.issues[0]?.message).toBe(
      'Serial-numbered listings need a policy before you can publish.',
    )
    expect(
      policyStep.safeParse({
        ...base,
        isSerialized: true,
        acceptedProblems: ["Won't power on"],
        resolution: 'repair',
      }).success,
    ).toBe(true)
  })

  it('review rejects a policy written for the other item type', () => {
    const draft = {
      item,
      type: { isSerialized: true, uniqueId: '352098114371234' },
      policy: { isSerialized: false, doorRejectReasons: ['damaged'], acceptedProblems: [] },
    }
    expect(listingDraft.safeParse(draft).success).toBe(false)
  })
})
