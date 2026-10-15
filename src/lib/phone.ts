/** Kenyan mobile numbers: the 9 national digits after +254, starting with 7 or 1. */
const NATIONAL = /^[71]\d{8}$/

export const PHONE_ERROR = 'Enter 9 digits starting with 7 or 1'

/** Strips formatting and any +254, 254 or 0 prefix, keeping at most 9 national digits. */
export function toNationalDigits(input: string): string {
  let digits = input.replace(/\D/g, '')
  if (digits.startsWith('254')) digits = digits.slice(3)
  else if (digits.startsWith('0')) digits = digits.slice(1)
  return digits.slice(0, 9)
}

/** Groups national digits as "712 345 678" while typing. */
export function formatNational(digits: string): string {
  return [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 9)].filter(Boolean).join(' ')
}

export function isValidNational(digits: string): boolean {
  return NATIONAL.test(digits)
}

/** The API form: "+254712345678". */
export function toE164(digits: string): string {
  return `+254${digits}`
}

/** Masked for display outside the admin console: "+254 712 *** 678". */
export function maskPhone(input: string): string {
  const d = toNationalDigits(input)
  if (!isValidNational(d)) return '+254 *** *** ***'
  return `+254 ${d.slice(0, 3)} *** ${d.slice(6)}`
}
