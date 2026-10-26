/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// M17 #137: the README stays accurate.
const readme = readFileSync('README.md', 'utf8')

describe('README', () => {
  it('links and embeds only files that exist', () => {
    const targets = [...readme.matchAll(/\]\(((?!https?:)[^)#]+)\)/g)].map((m) => m[1] as string)
    expect(targets.length).toBeGreaterThan(5)
    for (const target of targets) expect(existsSync(target), target).toBe(true)
  })

  it('lists every npm script', () => {
    const { scripts } = JSON.parse(readFileSync('package.json', 'utf8')) as {
      scripts: Record<string, string>
    }
    for (const name of Object.keys(scripts).filter((n) => !['lint:fix', 'api:types'].includes(n)))
      expect(readme, name).toMatch(new RegExp(`npm (run )?${name}|\`${name}\``))
  })

  it('has the architecture diagram', () => {
    expect(readme).toContain('```mermaid')
  })
})
