import { describe, expect, it } from 'vitest'
import { toOrder } from '@/models/api/transactions'
import type { TransactionStatus } from '@/models/domain/stateMeta'
import { orderResponse } from '@/test/fixtures'
import { nextSteps, reportGate, validateReport } from './useReportIssue'

const at = (status: TransactionStatus, serialized = true) =>
  toOrder(orderResponse({ status, listing: { ...orderResponse().listing, is_serialized: serialized } }))

describe('report gate', () => {
  it('opens the form only during the hold on serialized items', () => {
    expect(reportGate(at('hold_24h'))).toBe('form')
    expect(reportGate(at('hold_24h', false))).toBe('not_eligible')
    expect(reportGate(at('released'))).toBe('closed')
    expect(reportGate(at('return_in_transit'))).toBe('already_reported')
    expect(reportGate(at('escalated_admin_review'))).toBe('already_reported')
  })
})

describe('report validation', () => {
  const ok = {
    category: 'not_working' as const,
    description: 'The screen flickers after a minute.',
    confirmed: true,
  }

  it('accepts a complete report', () => {
    expect(validateReport(ok)).toEqual({})
  })

  it('asks for a category, 20 to 500 characters and the confirmation', () => {
    expect(validateReport({ category: undefined, description: 'short', confirmed: false })).toEqual({
      category: 'Choose the problem.',
      description: 'Tell us a bit more: at least 20 characters.',
      confirmed: 'Confirm that you will send the item back.',
    })
    expect(validateReport({ ...ok, description: 'x'.repeat(501) }).description).toBe(
      'Keep it under 500 characters.',
    )
  })

  it('needs no return confirmation for "Something else"', () => {
    expect(validateReport({ ...ok, category: 'other', confirmed: false })).toEqual({})
  })
})

describe('next steps', () => {
  it("follows the seller's declared resolution, or the support path", () => {
    expect(nextSteps('not_working', 'repair')).toEqual([
      'Send the item back',
      'The seller checks it',
      'The seller repairs it',
    ])
    expect(nextSteps('other', 'repair')[0]).toBe('Vekro support reviews your report')
  })
})
