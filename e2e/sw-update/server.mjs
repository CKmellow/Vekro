// Serves two production builds of the app, "A" and "B", the way the web image's nginx does, and switches between
// them on POST /__deploy/<A|B>: a deploy in miniature for e2e/sw-update.spec.ts (#302).
//
// Builds once (VEKRO_BUILD_ID=e2e-A) into .sw-e2e/A, then copies it to .sw-e2e/B with the build id changed in
// index.html and version.json and the matching precache revision in sw.js, which is exactly what a new deploy
// changes for the service worker. The API is not needed: /api answers 503.
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize } from 'node:path'

const port = Number(process.env.SW_E2E_PORT ?? 4174)
const root = '.sw-e2e'

function build() {
  rmSync(root, { recursive: true, force: true })
  execFileSync('npx', ['vite', 'build', '--outDir', join(root, 'A'), '--emptyOutDir'], {
    stdio: 'inherit',
    env: { ...process.env, VEKRO_BUILD_ID: 'e2e-A' },
  })
  cpSync(join(root, 'A'), join(root, 'B'), { recursive: true })
  const b = (file) => join(root, 'B', file)
  const md5 = (text) => createHash('md5').update(text).digest('hex')
  const oldIndex = readFileSync(b('index.html'), 'utf8')
  const newIndex = oldIndex.replace('content="e2e-A"', 'content="e2e-B"')
  if (newIndex === oldIndex) throw new Error('build id not found in index.html')
  writeFileSync(b('index.html'), newIndex)
  writeFileSync(b('version.json'), '{"build":"e2e-B"}\n')
  const sw = readFileSync(b('sw.js'), 'utf8')
  const newSw = sw.replace(md5(oldIndex), md5(newIndex))
  if (newSw === sw) throw new Error('index.html revision not found in sw.js')
  writeFileSync(b('sw.js'), newSw)
}

const types = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
}
// Same split as deploy/nginx.conf.template.
const FRESH = /^\/(sw\.js|workbox-.*\.js|registerSW\.js|manifest\.webmanifest|index\.html|version\.json)$/

build()
let current = 'A'

createServer((req, res) => {
  const url = new URL(req.url ?? '/', 'http://localhost')
  const deploy = url.pathname.match(/^\/__deploy\/([AB])$/)
  if (req.method === 'POST' && deploy) {
    current = deploy[1]
    res.writeHead(204).end()
    return
  }
  if (url.pathname.startsWith('/api/')) {
    res.writeHead(503, { 'content-type': 'application/json' }).end('{"detail":"no API in this test"}')
    return
  }
  const dir = join(root, current)
  let file = normalize(join(dir, url.pathname))
  if (!file.startsWith(dir) || !existsSync(file) || statSync(file).isDirectory())
    file = join(dir, 'index.html')
  const name = file === join(dir, 'index.html') ? '/index.html' : url.pathname
  const cache = FRESH.test(name)
    ? 'no-store'
    : name.startsWith('/assets/')
      ? 'public, max-age=31536000, immutable'
      : 'no-cache'
  res.writeHead(200, {
    'content-type': types[extname(file)] ?? 'application/octet-stream',
    'cache-control': cache,
  })
  res.end(readFileSync(file))
}).listen(port, () => console.log(`sw-update server on ${port}`))
