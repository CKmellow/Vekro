/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CSP_HEADER } from './csp'

// M17 #134: the served headers match the app's CSP, and the shell is never cached.
const nginx = readFileSync('deploy/nginx.conf.template', 'utf8')

describe('deploy/nginx.conf.template', () => {
  it('sends the same CSP header the app is built for, on every location', () => {
    const headers = [...nginx.matchAll(/add_header Content-Security-Policy "([^"]+)"/g)].map((m) => m[1])
    expect(headers.length).toBeGreaterThanOrEqual(4)
    for (const header of headers) expect(header).toBe(CSP_HEADER)
  })

  it('proxies the API on the same site and keeps the shell and service worker fresh', () => {
    expect(nginx).toMatch(/location \/api\/ \{\s+proxy_pass \$\{API_UPSTREAM\}\//)
    expect(nginx).toMatch(/sw\\\.js[\s\S]*?no-cache/)
    expect(nginx).toMatch(/location \/assets\/[\s\S]*?immutable/)
    expect(nginx).toContain('Strict-Transport-Security')
  })

  it('builds with the API on /api', () => {
    expect(readFileSync('Dockerfile', 'utf8')).toContain('VITE_API_BASE_URL=/api')
  })
})
