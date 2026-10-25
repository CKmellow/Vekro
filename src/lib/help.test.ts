import { describe, expect, it } from 'vitest'
import { HELP, LANDING_FAQ } from './help'

describe('help copy', () => {
  it('has unique ids and the landing FAQ resolves to real entries', () => {
    const ids = HELP.flatMap((s) => s.items.map((i) => i.id))
    expect(new Set(ids).size).toBe(ids.length)
    expect(LANDING_FAQ).toHaveLength(5)
    expect(LANDING_FAQ.every(Boolean)).toBe(true)
  })

  it('never asks for photos and makes no guarantees', () => {
    const text = JSON.stringify(HELP).toLowerCase()
    expect(text).not.toMatch(/upload a photo|send photos|guarantee|licensed|regulated/)
  })
})
