import { describe, expect, it } from 'vitest'
import { outcomeSentence, splitError } from './useAdminCase'

const c = { amount: 52000, buyerName: 'Brian Otieno', sellerName: 'Amina Gadgets' }

describe('admin decision wording', () => {
  it('restates every outcome with names and amounts', () => {
    expect(outcomeSentence('refund', c, 0)).toBe(
      'Refund KES 52,000 to Brian Otieno. Amina Gadgets receives nothing.',
    )
    expect(outcomeSentence('release', c, 0)).toBe(
      'Release KES 52,000 to Amina Gadgets. Brian Otieno receives nothing.',
    )
    expect(outcomeSentence('split', c, 31200)).toBe(
      'Brian Otieno receives KES 20,800 and Amina Gadgets receives KES 31,200.',
    )
  })

  it('keeps both sides of a split above zero', () => {
    expect(splitError(52000, 26000)).toBeUndefined()
    expect(splitError(52000, 0)).toBe('Each side must get between KES 1 and KES 51,999.')
    expect(splitError(52000, 52000)).toBeDefined()
  })
})
