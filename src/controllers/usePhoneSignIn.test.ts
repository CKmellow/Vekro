import { describe, expect, it } from 'vitest'
import { clock } from './usePhoneSignIn'

describe('clock', () => {
  it('rounds up to whole seconds', () => {
    expect(clock(28_100)).toBe('0:29')
    expect(clock(300_000)).toBe('5:00')
    expect(clock(-5)).toBe('0:00')
  })
})
