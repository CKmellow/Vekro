import { describe, expect, it } from 'vitest'
import { issueLabel } from './listing'

describe('issue categories', () => {
  it('labels categories for chips, passing unknown ones through', () => {
    expect(issueLabel('not_working')).toBe("Doesn't work properly")
    expect(issueLabel('missing_parts')).toBe('Parts are missing')
    expect(issueLabel('something_new')).toBe('something_new')
    expect(issueLabel(null)).toBeNull()
  })
})
