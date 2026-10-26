import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useOnline, useStaleSince } from './useOnline'

afterEach(() => vi.restoreAllMocks())

describe('useOnline and useStaleSince', () => {
  it('follows the browser and dates stale data only while offline', () => {
    const onLine = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    const at = Date.parse('2026-10-26T11:36:00Z')
    const { result } = renderHook(() => ({
      online: useOnline(),
      stale: useStaleSince({ data: [], dataUpdatedAt: at }),
      empty: useStaleSince({ data: undefined, dataUpdatedAt: 0 }),
    }))
    expect(result.current).toEqual({ online: true, stale: null, empty: null })

    onLine.mockReturnValue(false)
    act(() => {
      window.dispatchEvent(new Event('offline'))
    })
    expect(result.current.online).toBe(false)
    expect(result.current.stale).toMatch(/14:36/)
    expect(result.current.empty).toBeNull()
  })
})
