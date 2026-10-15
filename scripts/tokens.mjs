// Generates src/styles/tokens.css from .stitch/DESIGN.md (git-ignored, local only).
// CI never runs this; the generated file is committed.
import { execFileSync } from 'node:child_process'
import { existsSync, writeFileSync } from 'node:fs'

const SOURCE = '.stitch/DESIGN.md'
const OUT = 'src/styles/tokens.css'

export function exportTokens() {
  if (!existsSync(SOURCE)) throw new Error(`${SOURCE} not found. It is local-only; ask Cyprian for it.`)
  const css = execFileSync(
    'npx',
    ['--no-install', 'design.md', 'export', '--format', 'css-tailwind', SOURCE],
    {
      encoding: 'utf8',
    },
  )
  return `/* Generated from .stitch/DESIGN.md by \`npm run tokens\`. Do not edit by hand. */\n${css.trim()}\n`
}

if (import.meta.url === `file://${process.argv[1]}`) {
  writeFileSync(OUT, exportTokens())
  console.log(`wrote ${OUT}`)
}
