// Refreshes api/openapi.json from the backend, then regenerates src/models/api/schema.d.ts.
//   npm run api:sync                         # from OPENAPI_URL (default http://127.0.0.1:8000/openapi.json)
//   npm run api:sync -- --file ../backend/api/openapi.json
//   npm run api:types                        # regenerate types from the committed api/openapi.json only
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const args = process.argv.slice(2)
const typesOnly = args.includes('--types-only')
const fileIndex = args.indexOf('--file')

if (!typesOnly) {
  let spec
  if (fileIndex >= 0) {
    spec = JSON.parse(readFileSync(args[fileIndex + 1], 'utf8'))
  } else {
    const url = process.env.OPENAPI_URL ?? 'http://127.0.0.1:8000/openapi.json'
    const res = await fetch(url)
    if (!res.ok) throw new Error(`GET ${url} -> ${res.status}`)
    spec = await res.json()
  }
  if (!spec.openapi || !spec.paths) throw new Error('Not an OpenAPI document')
  writeFileSync('api/openapi.json', `${JSON.stringify(spec, null, 2)}\n`)
  console.log(`api/openapi.json: ${Object.keys(spec.paths).length} paths`)
}

execFileSync(
  'npx',
  ['--no-install', 'openapi-typescript', 'api/openapi.json', '-o', 'src/models/api/schema.d.ts'],
  {
    stdio: 'inherit',
  },
)
