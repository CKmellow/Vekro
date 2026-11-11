/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { CSP_HEADER, CSP_HEADER_PLACEHOLDER, cspFor, cspHeaderFor, renderNginxTemplate } from './csp'

// M17 #134: the served headers match the app's CSP, and the shell is never cached.
// #294: the build fills in the header, so the anchoring RPC origin reaches it too.
const nginx = readFileSync('deploy/nginx.conf.template', 'utf8')
const headersOf = (conf: string) =>
  [...conf.matchAll(/add_header Content-Security-Policy "([^"]+)"/g)].map((m) => m[1] ?? '')

describe('deploy/nginx.conf.template', () => {
  it('takes its CSP header from the build on every location, never a hard-coded policy', () => {
    const headers = headersOf(nginx)
    expect(headers.length).toBeGreaterThanOrEqual(3)
    for (const header of headers) expect(header).toBe(CSP_HEADER_PLACEHOLDER)
    expect(nginx).not.toContain('connect-src')
  })

  it('renders the same header as the app without an anchoring RPC', () => {
    const headers = headersOf(renderNginxTemplate(nginx))
    expect(headers.length).toBeGreaterThanOrEqual(3)
    for (const header of headers) expect(header).toBe(CSP_HEADER)
  })

  it('adds the anchoring RPC origin to connect-src, matching the meta policy', () => {
    const rendered = renderNginxTemplate(nginx, 'https://sepolia.base.org/')
    expect(rendered).not.toContain(CSP_HEADER_PLACEHOLDER)
    for (const header of headersOf(rendered)) {
      expect(header).toBe(cspHeaderFor('https://sepolia.base.org'))
      expect(header).toContain("connect-src 'self' https://sepolia.base.org;")
      expect(header.startsWith(cspFor('https://sepolia.base.org'))).toBe(true)
    }
    // Only the origin: a path (for example a keyed RPC URL) never reaches the header.
    expect(renderNginxTemplate(nginx, 'https://rpc.example/v2/key')).toContain(
      "connect-src 'self' https://rpc.example;",
    )
  })

  it('sends the full security header set from every app location, and one set on /api (#306)', () => {
    // nginx drops server-level add_header lines in a location with its own, so each must repeat all.
    const blocks = [...nginx.matchAll(/^ {2}location ([^{]+)\{([\s\S]*?)\n {2}\}/gm)].map((m) => ({
      where: (m[1] ?? '').trim(),
      body: m[2] ?? '',
    }))
    const app = blocks.filter((b) => b.where !== '/api/')
    expect(app.map((b) => b.where)).toHaveLength(3)
    for (const { where, body } of app) {
      for (const header of [
        'Content-Security-Policy',
        'Strict-Transport-Security "max-age=31536000; includeSubDomains"',
        'X-Content-Type-Options "nosniff"',
        'X-Frame-Options "DENY"',
        'Referrer-Policy "strict-origin-when-cross-origin"',
        'Permissions-Policy',
      ])
        expect(body, `${where} ${header}`).toContain(`add_header ${header}`)
    }
    const api = blocks.find((b) => b.where === '/api/')?.body ?? ''
    expect(api).toContain('add_header Cache-Control "no-store" always')
    expect(api).not.toContain('Strict-Transport-Security')
    // Nothing at server level, which would be inherited only by locations without their own.
    expect(nginx.split(/^ {2}location/m)[0]).not.toMatch(/^\s*add_header/m)
  })

  it('proxies the API on the same site and keeps the shell and service worker fresh', () => {
    expect(nginx).toMatch(/location \/api\/ \{\s+proxy_pass \$\{API_UPSTREAM\}\//)
    // #302: no-store, so Cloudflare neither caches the worker nor stretches it to its 4-hour browser TTL.
    const fresh = nginx.match(/location ~ \^\/\(([^)]+)\)\$ \{\s+add_header Cache-Control "([^"]+)"/)
    expect(fresh?.[2]).toBe('no-store')
    for (const file of ['sw', 'registerSW', 'manifest', 'index', 'version'])
      expect(fresh?.[1]).toContain(file)
    expect(nginx).toMatch(/location \/assets\/[\s\S]*?immutable/)
    expect(nginx).toContain('Strict-Transport-Security')
  })
})

describe('web image', () => {
  const dockerfile = readFileSync('Dockerfile', 'utf8')
  const deploy = readFileSync('.github/workflows/deploy.yml', 'utf8')

  it('builds with the API on /api and serves the rendered nginx template', () => {
    expect(dockerfile).toContain('VITE_API_BASE_URL=/api')
    expect(dockerfile).toContain('COPY --from=build /app/.deploy/default.conf.template')
    expect(dockerfile).not.toContain('COPY deploy/nginx.conf.template')
  })

  it('rolls out over SSH with the backend deploy script, only once enabled (#296)', () => {
    expect(deploy).not.toContain('DEPLOY_HOOK_URL')
    expect(deploy).toMatch(/roll-out:\s+needs: image\s+if: vars\.DEPLOY_ENABLED == 'true'/)
    expect(deploy).toContain("deploy/deploy.sh web '${{ github.sha }}'")
    expect(deploy).toContain('StrictHostKeyChecking=yes')
  })

  it('stamps the image with its commit (#302)', () => {
    expect(dockerfile).toMatch(/ARG VEKRO_BUILD_ID=dev[\s\S]*VEKRO_BUILD_ID=\$VEKRO_BUILD_ID/)
    expect(deploy).toContain('VEKRO_BUILD_ID=${{ github.sha }}')
  })

  it('takes the anchoring registry as build arguments from repository variables', () => {
    for (const name of ['VITE_ANCHOR_CHAIN_ID', 'VITE_ANCHOR_REGISTRY_ADDRESS', 'VITE_ANCHOR_RPC_URL']) {
      expect(dockerfile).toContain(`${name}=`)
      expect(deploy).toContain(`${name}=\${{ vars.${name} }}`)
    }
  })
})
