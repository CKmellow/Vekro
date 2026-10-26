/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

// M16 #132: every animation has a reduced-motion fallback. These checks keep it that way.
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : []
  })
}
const files = sources('src').map((path) => ({ path, text: readFileSync(path, 'utf8') }))

describe('reduced motion', () => {
  it('stops every CSS animation and transition when the person asks for less motion', () => {
    const theme = readFileSync('src/styles/theme.css', 'utf8')
    const block = theme.slice(theme.indexOf('@media (prefers-reduced-motion: reduce)'))
    expect(block).toMatch(/animation-duration:\s*0\.01ms !important/)
    expect(block).toMatch(/transition-duration:\s*0\.01ms !important/)
    expect(block).toMatch(/scroll-behavior:\s*auto !important/)
  })

  it('wraps the app in MotionConfig reducedMotion="user"', () => {
    expect(readFileSync('src/app/providers.tsx', 'utf8')).toContain('<MotionConfig reducedMotion="user">')
  })

  it('gives every motion component its own fallback', () => {
    const missing = files
      .filter((f) => /from 'motion\/react'/.test(f.text) && /<motion\.|animate=/.test(f.text))
      .filter((f) => !/useReducedMotion|reduce/.test(f.text))
      .map((f) => f.path)
    expect(missing).toEqual([])
  })

  it('never smooth-scrolls without checking the preference', () => {
    const missing = files
      .filter((f) => f.text.includes("behavior: 'smooth'") && !/reduce \? 'auto' : 'smooth'/.test(f.text))
      .map((f) => f.path)
    expect(missing).toEqual([])
  })

  it('turns chart animations off (Recharts ignores the CSS rule)', () => {
    const charts = files.filter((f) => /from 'recharts'/.test(f.text))
    for (const f of charts) {
      const marks = (f.text.match(/<(Area|Bar|Line|Pie)\b/g) ?? []).length
      const off = (f.text.match(/isAnimationActive=\{false\}/g) ?? []).length
      expect(off, f.path).toBe(marks)
    }
  })
})
