import { describe, expect, it } from 'vitest'
import { moneyHolder, payingHint, paymentNote } from './paymentNote'

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

describe('moneyHolder (#290)', () => {
  it('says card money is held by Pesapal, never the Vekro vault', () => {
    expect(moneyHolder('pesapal')).toBe('Held by Pesapal')
    expect(payingHint('pesapal')).toBe('Your card payment will be held by Pesapal, not paid to the seller.')
    expect(`${moneyHolder('pesapal')} ${payingHint('pesapal')}`).not.toMatch(/vault|escrow/i)
  })

  it('keeps the vault for M-Pesa orders', () => {
    for (const rail of ['simulated', 'daraja'] as const) expect(moneyHolder(rail)).toBe('Vekro vault')
  })

  it('says eConfirm money is held by eConfirm, never the Vekro vault (#308)', () => {
    expect(moneyHolder('econfirm')).toBe('Held by eConfirm')
    expect(payingHint('econfirm')).toBe(
      'Your money will be held by eConfirm, an independent escrow, not paid to the seller.',
    )
    expect(`${moneyHolder('econfirm')} ${payingHint('econfirm')}`).not.toMatch(/vault/i)
  })
})
