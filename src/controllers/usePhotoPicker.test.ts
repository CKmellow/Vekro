import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { usePhotoPicker } from './usePhotoPicker'

const compressImage = vi.fn()
vi.mock('@/lib/image', () => ({ compressImage: (file: File) => compressImage(file) }))

const photo = (name: string) => new File(['x'.repeat(2000)], name, { type: 'image/jpeg' })

beforeEach(() => {
  compressImage.mockReset().mockResolvedValue(new Blob(['small']))
  URL.createObjectURL = vi.fn((f: Blob) => `blob:${(f as File).name}`)
  URL.revokeObjectURL = vi.fn()
})

describe('usePhotoPicker', () => {
  it('keeps at most four photos, images only, and compresses each', async () => {
    const { result } = renderHook(() => usePhotoPicker())
    let outcome = { rejected: 0 }
    act(() => {
      outcome = result.current.add([
        photo('1.jpg'),
        photo('2.jpg'),
        new File(['%PDF'], 'receipt.pdf', { type: 'application/pdf' }),
        photo('3.jpg'),
        photo('4.jpg'),
        photo('5.jpg'),
      ])
    })
    expect(outcome.rejected).toBe(2)
    expect(result.current.photos.map((p) => p.name)).toEqual(['1.jpg', '2.jpg', '3.jpg', '4.jpg'])
    await waitFor(() => expect(result.current.photos.every((p) => p.status === 'ready')).toBe(true))
    expect(result.current.photos[0]?.compressedBytes).toBe(5)
    expect(result.current.readyBlobs()).toHaveLength(4)
  })

  it('reorders, so another photo can become the cover', () => {
    const { result } = renderHook(() => usePhotoPicker())
    act(() => void result.current.add([photo('a.jpg'), photo('b.jpg')]))
    const second = result.current.photos[1]?.id ?? ''
    act(() => result.current.move(second, -1))
    expect(result.current.photos.map((p) => p.name)).toEqual(['b.jpg', 'a.jpg'])
    act(() => result.current.move(second, -1))
    expect(result.current.photos.map((p) => p.name)).toEqual(['b.jpg', 'a.jpg'])
  })

  it('marks a failed photo and retries it', async () => {
    compressImage.mockRejectedValueOnce(new Error('decode'))
    const { result } = renderHook(() => usePhotoPicker())
    act(() => void result.current.add([photo('heic.jpg')]))
    await waitFor(() => expect(result.current.photos[0]?.status).toBe('failed'))
    act(() => result.current.retry(result.current.photos[0]?.id ?? ''))
    await waitFor(() => expect(result.current.photos[0]?.status).toBe('ready'))
  })
})
