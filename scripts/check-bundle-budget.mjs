// Buyer bundle budget (M16 #128): gzip bytes a buyer downloads before the pay or order page can
// render, read from Vite's manifest after `npm run build`. Fails CI when a route goes over budget.
import { readFileSync } from 'node:fs'
import { gzipSync } from 'node:zlib'

const KB = 1024
const page = (name) => ['index.html', `src/views/pages/buyer/${name}.tsx`]
// Budgets sit a little above today's sizes, so growth is a reviewed decision.
const BUDGETS = {
  'entry (every page)': { entries: ['index.html'], max: 185 * KB },
  'B3 order tracker (the SMS link)': { entries: page('OrderTrackerPage'), max: 230 * KB },
  'B1 pay (the Trust Link)': { entries: page('PayPage'), max: 265 * KB },
  'B4 inspection (at the door)': { entries: page('InspectionPage'), max: 230 * KB },
  'B8 sign in': { entries: page('BuyerSignInPage'), max: 200 * KB },
  'landing and help': { entries: ['index.html', 'src/app/router/screens/shared.ts'], max: 210 * KB },
}

const manifest = JSON.parse(readFileSync('dist/.vite/manifest.json', 'utf8'))
const gz = new Map()
const size = (file) => {
  if (!gz.has(file)) gz.set(file, gzipSync(readFileSync(`dist/${file}`)).length)
  return gz.get(file)
}

/** Every file loaded up front for these entries: their JS, static imports and CSS. */
function files(entries) {
  const seen = new Set()
  const out = new Set()
  const walk = (key) => {
    if (seen.has(key)) return
    seen.add(key)
    const chunk = manifest[key]
    if (!chunk) throw new Error(`Not in the manifest: ${key}`)
    out.add(chunk.file)
    for (const css of chunk.css ?? []) out.add(css)
    for (const imported of chunk.imports ?? []) walk(imported)
  }
  entries.forEach(walk)
  return [...out]
}

let failed = false
for (const [name, { entries, max }] of Object.entries(BUDGETS)) {
  const total = files(entries).reduce((sum, file) => sum + size(file), 0)
  const ok = total <= max
  failed ||= !ok
  console.log(
    `${ok ? 'ok  ' : 'OVER'} ${name}: ${(total / KB).toFixed(1)} kB of ${(max / KB).toFixed(0)} kB (gzip)`,
  )
}
if (failed) {
  console.error('Bundle budget exceeded. Lazy-load the new code, or raise the budget in a reviewed PR.')
  process.exit(1)
}
