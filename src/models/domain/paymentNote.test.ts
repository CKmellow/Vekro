import { describe, expect, it } from 'vitest'
import { paymentNote } from './paymentNote'

const note = (
  rail: 'simulated' | 'daraja' | 'pesapal' | 'econfirm',
  mode: 'sandbox' | 'live',
  status = 'locked',
) => paymentNote({ collection: { rail, mode }, status: status as 'locked' })

describe('paymentNote (backend #257)', () => {
  it('always calls a sandbox payment a test, naming the rail', () => {
    expect(note('daraja', 'sandbox', 'awaiting_payment')).toBe(
      'Test payment via M-Pesa sandbox: no real money moves.',
    )
    expect(note('pesapal', 'sandbox')).toBe('Test payment via Pesapal sandbox: no real money moves.')
    expect(note('simulated', 'sandbox')).toBe("Test payment via Vekro's simulator: no real money moves.")
  })

  it('describes a live payment once paid, never as escrow', () => {
    expect(note('pesapal', 'live')).toBe("Paid via Pesapal. Held by Vekro's payment partner until delivery.")
    expect(note('daraja', 'live')).toBe("Paid via M-Pesa. Held by Vekro's payment partner until delivery.")
    expect(note('daraja', 'live')).not.toMatch(/escrow/i)
  })

  it('says nothing about a live payment that has not been made', () => {
    expect(note('daraja', 'live', 'awaiting_payment')).toBeNull()
  })
})
