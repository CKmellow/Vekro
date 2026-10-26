/// <reference types="node" />
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CSP, CSP_DIRECTIVES, CSP_HEADER } from './csp'

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

  it('keeps sessions out of browser storage: only the listing draft uses localStorage', () => {
    expect(using(/localStorage|sessionStorage|indexedDB/)).toEqual(['src/models/domain/listingDraftStore.ts'])
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
