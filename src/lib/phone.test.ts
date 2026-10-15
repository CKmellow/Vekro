import { describe, expect, it } from 'vitest'
import { formatNational, isValidNational, maskPhone, toE164, toNationalDigits } from './phone'

describe('phone', () => {
  it.each([
    ['0712345678', '712345678'],
    ['+254 712 345 678', '712345678'],
    ['254112345678', '112345678'],
    ['712-345-6789', '712345678'],
  ])('normalises %s', (input, digits) => expect(toNationalDigits(input)).toBe(digits))

  it('groups digits while typing', () => {
    expect(formatNational('71')).toBe('71')
    expect(formatNational('7123')).toBe('712 3')
    expect(formatNational('712345678')).toBe('712 345 678')
  })

  it('accepts 9 digits starting with 7 or 1 only', () => {
    expect(isValidNational('712345678')).toBe(true)
    expect(isValidNational('112345678')).toBe(true)
    expect(isValidNational('812345678')).toBe(false)
    expect(isValidNational('71234567')).toBe(false)
  })

  it('formats for the API and masks for display', () => {
    expect(toE164('712345678')).toBe('+254712345678')
    expect(maskPhone('0712345678')).toBe('+254 712 *** 678')
    expect(maskPhone('12')).toBe('+254 *** *** ***')
  })
})
