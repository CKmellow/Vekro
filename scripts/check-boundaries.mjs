// Proves the MVC import rules in eslint.config.js reject violations and accept allowed imports.
import { ESLint } from 'eslint'

const eslint = new ESLint()
const cases = [
  {
    file: 'src/views/pages/Bad.tsx',
    code: "import { x } from '@/models/api/client'\nexport const y = x\n",
    fail: true,
  },
  { file: 'src/views/pages/BadFetch.tsx', code: "export const y = () => fetch('/x')\n", fail: true },
  {
    file: 'src/controllers/useBad.ts',
    code: "import { V } from '@/views/components/V'\nexport const y = V\n",
    fail: true,
  },
  { file: 'src/controllers/useJsx.tsx', code: 'export const y = () => <div />\n', fail: true },
  {
    file: 'src/models/domain/bad.ts',
    code: "import { c } from '@/controllers/useC'\nexport const y = c\n",
    fail: true,
  },
  { file: 'src/lib/bad.ts', code: "import { m } from '@/models/domain/m'\nexport const y = m\n", fail: true },
  {
    file: 'src/views/pages/Good.tsx',
    code: "import { useC } from '@/controllers/useC'\nexport const y = useC\n",
    fail: false,
  },
  {
    file: 'src/controllers/useGood.ts',
    code: "import { m } from '@/models/domain/m'\nexport const y = m\n",
    fail: false,
  },
  { file: 'src/models/api/client.ts', code: "export const get = () => fetch('/x')\n", fail: false },
]

let failures = 0
for (const c of cases) {
  const [result] = await eslint.lintText(c.code, { filePath: c.file })
  const boundary = result.messages.filter((m) =>
    ['no-restricted-imports', 'no-restricted-globals', 'no-restricted-syntax'].includes(m.ruleId ?? ''),
  )
  const failed = boundary.length > 0
  if (failed !== c.fail) {
    failures++
    console.error(`FAIL ${c.file}: expected ${c.fail ? 'a boundary error' : 'no boundary error'}`, boundary)
  } else {
    console.log(`ok   ${c.file}${failed ? ` (${boundary[0].message})` : ''}`)
  }
}
if (failures) process.exit(1)
console.log(`MVC boundaries: ${cases.length} cases passed`)
