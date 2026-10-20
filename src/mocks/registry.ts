import type { RequestHandler } from 'msw'
import type { Gap } from '@/models/api/adapters/gaps'

/**
 * Gap mock handlers, keyed by gap. Each handler file is tagged `// backend-gap #<issue>`
 * and registers itself here, e.g. `gapHandlers.SELLER_LISTS = [...]`.
 */
export const gapHandlers: Partial<Record<Gap, RequestHandler[]>> = {}

export function handlersFor(enabled: Set<Gap>, registry = gapHandlers): RequestHandler[] {
  return [...enabled].flatMap((gap) => registry[gap] ?? [])
}
