/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { STATE_META, statusView } from './stateMeta'

const openapi = JSON.parse(readFileSync('api/openapi.json', 'utf8'))
const backendStatuses: string[] = openapi.components.schemas.TransactionStatus.enum

describe('STATE_META', () => {
  it('maps exactly the backend TransactionStatus values', () => {
    // Fails when the backend adds or removes a status (after npm run api:sync) until STATE_META follows.
    expect(Object.keys(STATE_META).sort()).toEqual([...backendStatuses].sort())
  })

  it('never uses a raw state name as a label', () => {
    for (const m of Object.values(STATE_META)) {
      for (const label of [m.buyerLabel, m.sellerLabel]) {
        expect(label).not.toMatch(/_|^[A-Z0-9 ]+$/)
        expect(label[0]).toBe(label[0]?.toUpperCase())
      }
    }
  })

  it('applies the contract mapping', () => {
    expect(STATE_META.dispatched).toMatchObject({ buyerLabel: 'On the way', legacy: true })
    expect(STATE_META.resolved_refund.buyerLabel).toBe('Refund issued')
    expect(STATE_META.resolved_release.buyerLabel).toMatch(/^Complete/)
    expect(STATE_META.resolved_split).toMatchObject({
      buyerLabel: 'Settled by Vekro support',
      tone: 'plum',
      icon: 'scale',
    })
    expect(STATE_META.initiated).toEqual(STATE_META.awaiting_payment)
  })

  it('labels by role', () => {
    expect(statusView('locked', 'buyer').label).toBe('Paid, funds held safely')
    expect(statusView('locked', 'seller').label).toBe('Paid, ready to dispatch')
    expect(statusView('locked', 'admin').label).toBe('Paid, ready to dispatch')
  })
})
