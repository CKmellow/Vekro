import { useCallback, useEffect, useRef, useState } from 'react'
import { compressImage } from '@/lib/image'

export type PhotoStatus = 'compressing' | 'ready' | 'failed'

export interface Photo {
  id: string
  name: string
  previewUrl: string
  originalBytes: number
  compressedBytes?: number
  status: PhotoStatus
  error?: string
}

export const MAX_PHOTOS = 4

/**
 * Listing photos: up to four, first is the cover. Compresses each photo on the device and keeps the
 * blobs for the upload step (backend-gap #139 adds listing photos to the API).
 */
export function usePhotoPicker(max = MAX_PHOTOS) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const files = useRef(new Map<string, File>())
  const blobs = useRef(new Map<string, Blob>())

  const update = (id: string, patch: Partial<Photo>) =>
    setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)))

  const compress = useCallback(async (id: string) => {
    const file = files.current.get(id)
    if (!file) return
    update(id, { status: 'compressing', error: undefined })
    try {
      const blob = await compressImage(file)
      blobs.current.set(id, blob)
      update(id, { status: 'ready', compressedBytes: blob.size })
    } catch {
      update(id, { status: 'failed', error: "This photo couldn't be prepared. Try again or pick another." })
    }
  }, [])

  const add = (incoming: File[]) => {
    const room = max - photos.length
    const accepted = incoming.filter((f) => f.type.startsWith('image/')).slice(0, Math.max(0, room))
    const added = accepted.map((file) => {
      const id = crypto.randomUUID()
      files.current.set(id, file)
      return {
        id,
        name: file.name,
        previewUrl: URL.createObjectURL(file),
        originalBytes: file.size,
        status: 'compressing' as const,
      }
    })
    setPhotos((list) => [...list, ...added])
    added.forEach((p) => void compress(p.id))
    return { rejected: incoming.length - accepted.length }
  }

  const remove = (id: string) => {
    setPhotos((list) => {
      const photo = list.find((p) => p.id === id)
      if (photo) URL.revokeObjectURL(photo.previewUrl)
      return list.filter((p) => p.id !== id)
    })
    files.current.delete(id)
    blobs.current.delete(id)
  }

  /** Move one place earlier (-1) or later (+1). Index 0 is the cover. */
  const move = (id: string, by: -1 | 1) =>
    setPhotos((list) => {
      const from = list.findIndex((p) => p.id === id)
      const to = from + by
      if (from < 0 || to < 0 || to >= list.length) return list
      const next = [...list]
      const [photo] = next.splice(from, 1)
      if (photo) next.splice(to, 0, photo)
      return next
    })

  // Free preview URLs when the screen goes away.
  const latest = useRef(photos)
  latest.current = photos
  useEffect(() => () => latest.current.forEach((p) => URL.revokeObjectURL(p.previewUrl)), [])

  return {
    photos,
    max,
    add,
    remove,
    move,
    retry: (id: string) => void compress(id),
    /** Compressed blobs in display order, for the upload. */
    readyBlobs: () => photos.flatMap((p) => blobs.current.get(p.id) ?? []),
  }
}
