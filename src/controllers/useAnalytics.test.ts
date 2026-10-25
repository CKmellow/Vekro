import { describe, expect, it } from 'vitest'
import { duration, shortKes, toTiles } from './useAnalytics'

const k = (over = {}) => ({
  salesVolume: 1000,
  orders: 2,
  averageOrderValue: 500,
  completionRate: 1,
  disputeRate: 0.1,
  averageDispatchSeconds: 3600,
  ...over,
})

describe('analytics formatting', () => {
  it('shortens KES for axes and formats durations', () => {
    expect(shortKes(40_000)).toBe('KES 40k')
    expect(shortKes(1_250_000)).toBe('KES 1.3M')
    expect(shortKes(800)).toBe('KES 800')
    expect(duration(24_000)).toBe('6h 40m')
    expect(duration(600)).toBe('10m')
    expect(duration(null)).toBe('–')
  })

  it('treats a rising dispute rate as bad and skips deltas without a base', () => {
    const tiles = toTiles(k({ disputeRate: 0.2 }), k({ salesVolume: 0 }))
    const disputes = tiles.find((t) => t.key === 'disputes')
    expect(disputes?.delta).toMatchObject({ up: true, good: false, text: '+10 pts' })
    expect(tiles.find((t) => t.key === 'volume')?.delta).toBeUndefined()
  })
})
