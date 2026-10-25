/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { toOrder, toOrderSummary } from '@/models/api/transactions'
import { getAvailableActions } from '@/models/domain/actions'
import { statusView, type TransactionStatus } from '@/models/domain/stateMeta'
import { orderResponse, orderSummaryResponse } from '@/test/fixtures'
import { toBuyerCard } from './useMyOrders'
import { nextStep, moneyAt } from './useOrderTracker'
import { toOrderRow } from './useOrdersPage'
import { actionPanel } from './useSellerOrder'
import { STATUS_GROUPS } from './useTransactionsExplorer'

// Driven by the backend contract, so a new status added after `npm run api:sync` fails here until every
// role's views handle it (M16 #131).
const openapi = JSON.parse(readFileSync('api/openapi.json', 'utf8'))
const STATUSES: TransactionStatus[] = openapi.components.schemas.TransactionStatus.enum

/** Human copy: never a raw state name, never empty. */
function human(text: string | undefined, status: TransactionStatus) {
  expect(text, `${status}: empty copy`).toBeTruthy()
  expect(text, `${status}: raw state name`).not.toContain(status)
  expect(text, `${status}: snake_case`).not.toMatch(/[a-z]_[a-z]/)
}

describe.each(STATUSES)('%s', (status) => {
  const order = toOrder(orderResponse({ status, payment: null }))
  const summary = toOrderSummary(orderSummaryResponse({ status }))

  it('has a human label in every role', () => {
    for (const role of ['buyer', 'seller', 'admin'] as const) human(statusView(status, role).label, status)
  })

  it('gives the buyer a next step and a money location (B3, B9)', () => {
    const step = nextStep(order)
    human(step.title, status)
    human(step.body, status)
    expect(['buyer', 'vault', 'seller']).toContain(moneyAt(status))
    human(toBuyerCard(summary).status.label, status)
  })

  it('gives the seller an action panel and a list row (S5, S6)', () => {
    const panel = actionPanel(order)
    human(panel.title, status)
    human(panel.body, status)
    human(toOrderRow(summary).status.label, status)
  })

  it('belongs to exactly one admin explorer group (A4)', () => {
    expect(STATUS_GROUPS.filter((g) => g.statuses.includes(status))).toHaveLength(1)
  })

  it('only offers actions that the role may take', () => {
    for (const role of ['buyer', 'seller', 'admin'] as const)
      expect(Array.isArray(getAvailableActions(role, { status }))).toBe(true)
  })
})

describe('an unmapped status', () => {
  it('shows a neutral label instead of crashing or leaking the raw name', () => {
    const view = statusView('brand_new_state' as TransactionStatus, 'buyer')
    expect(view.label).toBe('Updating')
    expect(STATUSES).not.toContain('brand_new_state')
  })
})
