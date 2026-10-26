/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// M17 #136: the demo seed uses the PAGES.md 0.1 sample data.
const seed = readFileSync('scripts/seed-demo.mjs', 'utf8')

describe('scripts/seed-demo.mjs', () => {
  it('uses the sample people and items', () => {
    for (const value of [
      "'Amina Gadgets'",
      "'Kilimani, Nairobi'",
      "'+254722118904'",
      "'Brian Otieno'",
      "'+254712345678'",
      "'iPhone 13, 128GB, Midnight', '52000'",
      "'Nike Air Force 1, size 42', '6500'",
      "'Kitenge wrap dress', '3200'",
      "'HP Pavilion 15 laptop', '68500'",
      "'3-seater sofa', '38000'",
    ])
      expect(seed).toContain(value)
  })

  it('never hard-codes a password other than the documented demo default', () => {
    expect(seed).toMatch(/process\.env\.DEMO_PASSWORD \?\? 'demo-pass-123'/)
    expect(seed).not.toMatch(/console\.log\([^)]*PASSWORD\)/)
  })

  it('leaves enough completed sales to unlock analytics, and one case for the console', () => {
    const accessories = seed.match(/\['[^']+', '\d+'\],/g) ?? []
    expect(accessories.length).toBeGreaterThanOrEqual(5)
    expect(seed).toContain("'escalate'")
  })
})
