/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CSP, CSP_DIRECTIVES, CSP_HEADER, cspFor } from './csp'

// M16 #130: guards for the security pass, so regressions fail CI.
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) return sources(path)
    return /\.tsx?$/.test(name) && !/\.test\./.test(name) ? [path] : []
  })
}
const files = sources('src').map((path) => ({ path, text: readFileSync(path, 'utf8') }))
const using = (pattern: RegExp) => files.filter((f) => pattern.test(f.text)).map((f) => f.path)

describe('content security policy', () => {
  it('allows only this origin, no eval and no inline scripts', () => {
    expect(CSP).not.toMatch(/unsafe-eval|https?:|\*/)
    expect(CSP_DIRECTIVES['script-src']).toEqual(["'self'"])
    expect(CSP_DIRECTIVES['object-src']).toEqual(["'none'"])
    expect(CSP_HEADER).toContain("frame-ancestors 'none'")
  })

  it('is injected into the built page', () => {
    expect(readFileSync('vite.config.ts', 'utf8')).toMatch(/http-equiv="Content-Security-Policy"/)
  })
})

describe('source rules', () => {
  it('never renders raw HTML', () => {
    expect(using(/dangerouslySetInnerHTML|\.innerHTML\s*=/)).toEqual([])
  })

  it('keeps sessions out of browser storage: only the listing draft, the theme, the install hint and the mode use localStorage', () => {
    // The theme choice (M25, #292, Cyprian 2026-11-09) is a per-device display preference, never a session.
    // So is the dismissed "Install Vekro" hint (#304), and Buying or Selling (M21, #315).
    expect(using(/localStorage|sessionStorage|indexedDB/)).toEqual([
      'src/lib/installHint.ts',
      'src/lib/mode.ts',
      'src/lib/theme.ts',
      'src/models/domain/listingDraftStore.ts',
    ])
    expect(using(/document\.cookie/)).toEqual(['src/models/api/csrf.ts'])
  })

  it('logs nothing in production builds', () => {
    const logs = files.filter((f) => /console\.(log|info|warn|error|debug)\(/.test(f.text))
    for (const f of logs) expect(f.text, f.path).toMatch(/import\.meta\.env\.DEV\)\s*console\./)
  })

  it('sends cookies with every API call and the CSRF header on unsafe ones', () => {
    const client = readFileSync('src/models/api/client.ts', 'utf8')
    expect(client).toContain("credentials: 'include'")
    expect(client).toContain('CSRF_HEADER')
  })
})

describe('CSP with the anchoring RPC', () => {
  it('adds only the RPC origin to connect-src', () => {
    const policy = cspFor('https://sepolia.base.org/some/path?key=x')
    expect(policy).toContain("connect-src 'self' https://sepolia.base.org;")
    expect(policy).not.toContain('key=x')
    expect(cspFor('not a url')).toBe(CSP)
    expect(cspFor()).toBe(CSP)
  })
})
