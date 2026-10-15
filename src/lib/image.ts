/** Client-side photo compression, so listings upload fast on metered mobile data. */
export interface CompressOptions {
  /** Longest edge in px. */
  maxEdge?: number
  /** JPEG/WebP quality, 0 to 1. */
  quality?: number
}

export async function compressImage(
  file: File,
  { maxEdge = 1600, quality = 0.8 }: CompressOptions = {},
): Promise<Blob> {
  if (!file.type.startsWith('image/')) throw new Error('Not a photo')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Canvas unavailable')
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
    if (!blob) throw new Error('Could not compress')
    // Never send a bigger file than the original.
    return blob.size < file.size ? blob : file
  } finally {
    bitmap.close()
  }
}

/** "240 KB", "1.2 MB". */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
