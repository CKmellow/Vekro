/// <reference types="node" />
import { readdirSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// M17 #138: every designed page has a row in the design-versus-build record.
describe('design/RECONCILIATION.md', () => {
  it('covers every design folder', () => {
    const record = readFileSync('design/RECONCILIATION.md', 'utf8')
    const ids = readdirSync('design', { withFileTypes: true })
      .filter((d) => d.isDirectory() && /^[A-Z]\d+-/.test(d.name))
      .map((d) => d.name.split('-')[0] as string)
    expect(ids.length).toBeGreaterThan(25)
    for (const id of ids) expect(record, id).toMatch(new RegExp(`^\\| ${id} `, 'm'))
  })
})
