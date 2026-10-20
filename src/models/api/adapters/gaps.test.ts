import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { handlersFor } from '@/mocks/registry'
import { GAPS, mockedGaps } from './gaps'

describe('gap flags', () => {
  it('turns on only gaps whose VITE_MOCK_ flag is truthy', () => {
    const on = mockedGaps({
      VITE_MOCK_TRANSACTION_READ: 'true',
      VITE_MOCK_SELLER_LISTS: '1',
      VITE_MOCK_DEADLINES: 'false',
      VITE_MOCK_ANALYTICS: '',
      VITE_MOCK_NOT_A_GAP: 'true',
    })
    expect([...on].sort()).toEqual(['SELLER_LISTS', 'TRANSACTION_READ'])
  })

  it('is off by default', () => {
    expect(mockedGaps({}).size).toBe(0)
  })

  it('lists every open gap from docs/BACKEND_GAPS.md with its issue', () => {
    expect(Object.keys(GAPS)).toHaveLength(17)
    expect(GAPS.TRANSACTION_READ).toEqual({ id: 'P0-1', issue: 6 })
    expect(GAPS.NOTIFICATION_PREFS).toEqual({ id: 'P2-5', issue: 150 })
  })
})

describe('gap handler registry', () => {
  it('registers handlers only for enabled gaps', () => {
    const read = http.get('/api/transactions/:id', () => HttpResponse.json({}))
    const lists = http.get('/api/seller/orders', () => HttpResponse.json([]))
    const registry = { TRANSACTION_READ: [read], SELLER_LISTS: [lists] }
    expect(handlersFor(new Set(['TRANSACTION_READ']), registry)).toEqual([read])
    expect(handlersFor(new Set(), registry)).toEqual([])
  })
})
