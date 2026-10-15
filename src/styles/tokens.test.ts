/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const tokens = readFileSync('src/styles/tokens.css', 'utf8')
const theme = readFileSync('src/styles/theme.css', 'utf8')
const fonts = readFileSync('src/styles/fonts.ts', 'utf8')

describe('design tokens', () => {
  it.each([
    ['--color-primary', '#0a6e4c'],
    ['--color-background', '#fbf9f4'],
    ['--color-saffron-700', '#8a5b00'],
    ['--color-dark-background', '#07110e'],
    ['--radius-lg', '20px'],
    ['--radius-xl', '28px'],
    ['--text-amount', '40px'],
  ])('defines %s as %s', (name, value) => {
    expect(tokens).toContain(`${name}: ${value};`)
  })

  it('removes the default Tailwind palette, fonts and shadows', () => {
    expect(theme).toMatch(/--color-\*: initial;/)
    expect(theme).toMatch(/--font-\*: initial;/)
    expect(theme).toMatch(/--shadow-\*: initial;/)
  })

  it('loads the three DESIGN.md font families', () => {
    for (const family of ['bricolage-grotesque', 'dm-sans', 'jetbrains-mono']) expect(fonts).toContain(family)
    for (const family of ['Bricolage Grotesque', 'DM Sans', 'JetBrains Mono']) expect(theme).toContain(family)
  })

  it.skipIf(!existsSync('.stitch/DESIGN.md'))('is in sync with .stitch/DESIGN.md', async () => {
    // @ts-expect-error plain JS module without types
    const { exportTokens } = await import('../../scripts/tokens.mjs')
    expect(tokens).toBe(exportTokens())
  })
})
