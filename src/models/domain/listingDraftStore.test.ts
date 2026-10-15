import { describe, expect, it } from 'vitest'
import { clearDraft, loadDraft, saveDraft } from './listingDraftStore'

describe('listing draft store', () => {
  it('round-trips a draft and survives unusable storage', () => {
    localStorage.clear()
    expect(saveDraft({ item: { title: 'Sofa' } } as never)).toBe(true)
    expect(loadDraft()?.draft).toEqual({ item: { title: 'Sofa' } })
    clearDraft()
    expect(loadDraft()).toBeNull()
    const broken = {
      setItem: () => {
        throw new Error('quota')
      },
      getItem: () => '{not json',
    } as unknown as Storage
    expect(saveDraft({} as never, broken)).toBe(false)
    expect(loadDraft(broken)).toBeNull()
  })
})
