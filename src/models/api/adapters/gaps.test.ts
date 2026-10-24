import { http, HttpResponse } from 'msw'
import { describe, expect, it } from 'vitest'
import { handlersFor } from '@/mocks/registry'
import { GAPS, mockedGaps } from './gaps'

describe('gap flags', () => {
  it('turns on only gaps whose VITE_MOCK_ flag is truthy', () => {
    const on = mockedGaps({
      VITE_MOCK_TIMELINE: 'true',
      VITE_MOCK_SELLER_PROFILE: '1',
      VITE_MOCK_ESCALATE: 'false',
      VITE_MOCK_ANALYTICS: '',
      VITE_MOCK_NOT_A_GAP: 'true',
    })
    expect([...on].sort()).toEqual(['SELLER_PROFILE', 'TIMELINE'])
  })

  it('is off by default', () => {
    expect(mockedGaps({}).size).toBe(0)
  })

  it('lists every open gap from docs/BACKEND_GAPS.md with its issue', () => {
    expect(Object.keys(GAPS)).toHaveLength(11)
    expect(GAPS.SELLER_PROFILE).toEqual({ id: 'P1-7', issue: 144 })
    expect(GAPS.NOTIFICATION_PREFS).toEqual({ id: 'P2-5', issue: 150 })
  })
})

describe('gap handler registry', () => {
  it('registers handlers only for enabled gaps', () => {
    const timeline = http.get('/api/transactions/:id/timeline', () => HttpResponse.json([]))
    const lists = http.get('/api/seller/orders', () => HttpResponse.json([]))
    const registry = { TIMELINE: [timeline], SELLER_PROFILE: [lists] }
    expect(handlersFor(new Set(['TIMELINE']), registry)).toEqual([timeline])
    expect(handlersFor(new Set(), registry)).toEqual([])
  })
})
