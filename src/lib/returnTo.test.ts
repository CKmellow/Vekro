import { describe, expect, it } from 'vitest'
import { safeReturnTo } from './returnTo'

describe('safeReturnTo', () => {
  it('keeps same-site paths with their query', () => {
    expect(safeReturnTo('/seller/orders?segment=held', '/seller')).toBe('/seller/orders?segment=held')
  })

  it.each([null, '', 'https://evil.example/x', '//evil.example', '/\\evil.example', 'javascript:alert(1)'])(
    'falls back for %s',
    (raw) => expect(safeReturnTo(raw, '/seller')).toBe('/seller'),
  )
})
