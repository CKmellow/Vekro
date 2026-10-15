/** Password rules shown under the field (PAGES.md S1). The backend needs 8 to 128 characters. */
export const PASSWORD_RULES = [
  { id: 'length', label: '8 or more characters', test: (p: string) => p.length >= 8 },
  { id: 'number', label: 'A number', test: (p: string) => /\d/.test(p) },
  { id: 'letter', label: 'A letter', test: (p: string) => /[a-z]/i.test(p) },
] as const

export type StrengthLabel = 'Too weak' | 'Weak' | 'Fair' | 'Strong'

/**
 * Four-segment meter. Each rule met fills a segment; the fourth needs 12+ characters or a mix of
 * cases and a symbol on top of the rules.
 */
export function passwordStrength(password: string): { score: 0 | 1 | 2 | 3 | 4; label: StrengthLabel } {
  if (!password) return { score: 0, label: 'Too weak' }
  const met = PASSWORD_RULES.filter((rule) => rule.test(password)).length
  const extra =
    met === 3 && (password.length >= 12 || (/[A-Z]/.test(password) && /[^a-z0-9]/i.test(password)))
  const score = (met + (extra ? 1 : 0)) as 0 | 1 | 2 | 3 | 4
  const label: StrengthLabel = met < 2 ? 'Too weak' : met === 2 ? 'Weak' : extra ? 'Strong' : 'Fair'
  return { score, label }
}
