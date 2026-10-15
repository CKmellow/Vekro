import { ChevronLeft, ChevronRight, ImagePlus, RotateCw, X } from 'lucide-react'
import { useId, useState, type DragEvent } from 'react'
import { cn } from '@/lib/cn'
import { formatBytes } from '@/lib/image'

export interface UploaderPhoto {
  id: string
  name: string
  previewUrl: string
  originalBytes: number
  compressedBytes?: number
  status: 'compressing' | 'ready' | 'failed'
  error?: string
}

export interface ImageUploaderProps {
  label: string
  hint?: string
  photos: UploaderPhoto[]
  max: number
  onAdd: (files: File[]) => void
  onRemove: (id: string) => void
  onMove: (id: string, by: -1 | 1) => void
  onRetry: (id: string) => void
}

const iconButton =
  'grid size-8 place-items-center rounded-full bg-ink-950/70 text-sand-0 transition-colors hover:bg-ink-950 disabled:opacity-30'

/** Drag and drop or pick up to `max` photos. The first is the cover; arrows reorder; each photo can fail and retry. */
export function ImageUploader({
  label,
  hint,
  photos,
  max,
  onAdd,
  onRemove,
  onMove,
  onRetry,
}: ImageUploaderProps) {
  const inputId = useId()
  const [dragging, setDragging] = useState(false)
  const full = photos.length >= max

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setDragging(false)
    if (!full) onAdd(Array.from(e.dataTransfer.files))
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="type-label text-ink-600">{label}</span>
        <span className="type-mono text-text-muted">
          {photos.length}/{max}
        </span>
      </div>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="Photos">
        {photos.map((photo, i) => (
          <li
            key={photo.id}
            className="relative aspect-square overflow-hidden rounded-md border border-border bg-sand-100"
          >
            <img src={photo.previewUrl} alt={photo.name} className="size-full object-cover" />
            {i === 0 && (
              <span className="type-label absolute top-2 left-2 rounded-full bg-emerald-700 px-2 py-0.5 text-sand-0">
                Cover
              </span>
            )}
            {photo.status === 'failed' ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-coral-50 px-3 pt-10 pb-3 text-center">
                <p role="alert" className="type-body-sm text-coral-600">
                  {photo.error}
                </p>
                <button
                  type="button"
                  onClick={() => onRetry(photo.id)}
                  className="type-body-sm inline-flex min-h-9 items-center gap-1.5 rounded-sm border border-coral-500 bg-surface px-3 font-semibold text-coral-600"
                >
                  <RotateCw aria-hidden="true" className="size-4" />
                  Try again
                </button>
              </div>
            ) : (
              <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-1">
                <button
                  type="button"
                  className={iconButton}
                  disabled={i === 0}
                  onClick={() => onMove(photo.id, -1)}
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                  <span className="sr-only">Move {photo.name} earlier</span>
                </button>
                <span
                  className="type-body-sm flex h-6 min-w-6 items-center justify-center rounded-full bg-surface/90 px-2 text-ink-800"
                  aria-live="polite"
                >
                  {photo.status === 'compressing' ? (
                    <>
                      <span
                        aria-hidden="true"
                        className="size-3 animate-spin rounded-full border-2 border-current border-t-transparent"
                      />
                      <span className="sr-only">Preparing {photo.name}</span>
                    </>
                  ) : (
                    photo.compressedBytes !== undefined && formatBytes(photo.compressedBytes)
                  )}
                </span>
                <button
                  type="button"
                  className={iconButton}
                  disabled={i === photos.length - 1}
                  onClick={() => onMove(photo.id, 1)}
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                  <span className="sr-only">Move {photo.name} later</span>
                </button>
              </div>
            )}
            <button
              type="button"
              className={cn(iconButton, 'absolute top-2 right-2')}
              onClick={() => onRemove(photo.id)}
            >
              <X aria-hidden="true" className="size-4" />
              <span className="sr-only">Remove {photo.name}</span>
            </button>
          </li>
        ))}
        {!full && (
          <li
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              'aspect-square rounded-md border-2 border-dashed transition-colors duration-(--duration-state)',
              dragging ? 'border-emerald-500 bg-emerald-50' : 'border-sand-300 bg-surface',
            )}
          >
            <label
              htmlFor={inputId}
              className="flex size-full cursor-pointer flex-col items-center justify-center gap-2 p-3 text-center has-focus-visible:outline-3 has-focus-visible:outline-emerald-400"
            >
              <ImagePlus aria-hidden="true" className="size-7 text-emerald-700" />
              <span className="type-body-sm font-semibold text-text">Add photo</span>
              <span className="type-body-sm text-text-muted max-sm:sr-only">or drop it here</span>
              <input
                id={inputId}
                type="file"
                accept="image/*"
                multiple
                className="sr-only"
                onChange={(e) => {
                  onAdd(Array.from(e.target.files ?? []))
                  e.target.value = ''
                }}
              />
            </label>
          </li>
        )}
      </ul>
      {hint && <p className="type-body-sm text-text-muted">{hint}</p>}
    </div>
  )
}
