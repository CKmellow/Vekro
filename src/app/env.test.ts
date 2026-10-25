/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const example = readFileSync('.env.example', 'utf8')
const gitignore = readFileSync('.gitignore', 'utf8')

describe('.env.example', () => {
  it('has no backend-gap mock flags left (gaps are built in the backend)', () => {
    expect(example).not.toMatch(/^VITE_MOCK_/m)
  })

  it('documents the API and dev-server variables', () => {
    for (const name of ['VITE_API_BASE_URL', 'VEKRO_API_TARGET', 'OPENAPI_URL', 'STITCH_API_KEY'])
      expect(example).toMatch(new RegExp(`^${name}=`, 'm'))
  })

  it('contains no secret values', () => {
    expect(example).toMatch(/^STITCH_API_KEY=$/m)
  })
})

describe('.gitignore', () => {
  it('keeps secrets, local docs and build output out of git', () => {
    for (const entry of [
      '.env',
      '/.stitch/DESIGN.md',
      '/docs/PAGES.md',
      '/LOCAL_EXECUTION_PLAN.md',
      'dist/',
      'coverage/',
    ])
      expect(gitignore.split('\n')).toContain(entry)
    expect(gitignore).toContain('!.env.example')
  })
})
