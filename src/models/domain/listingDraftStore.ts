import type { ListingDraft } from '@/models/schemas/listing'

/**
 * The unfinished create-listing form, kept on this device so a seller can come back to it (S7 "draft
 * restored" toast). Never holds photos, sessions or tokens. Storage can be unavailable (private mode), so
 * every access is guarded.
 */
const KEY = 'vekro:listing-draft:v1'

export interface StoredDraft {
  savedAt: string
  draft: ListingDraft
}

export function loadDraft(storage: Storage | undefined = globalThis.localStorage): StoredDraft | null {
  try {
    const raw = storage?.getItem(KEY)
    return raw ? (JSON.parse(raw) as StoredDraft) : null
  } catch {
    return null
  }
}

export function saveDraft(draft: ListingDraft, storage: Storage | undefined = globalThis.localStorage) {
  try {
    storage?.setItem(KEY, JSON.stringify({ savedAt: new Date().toISOString(), draft } satisfies StoredDraft))
    return true
  } catch {
    return false
  }
}

export function clearDraft(storage: Storage | undefined = globalThis.localStorage) {
  try {
    storage?.removeItem(KEY)
  } catch {
    // Nothing to clear.
  }
}
