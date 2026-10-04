// Neon Usage carries a copy of Theme Studio's color module so each plugin
// installs on its own. This keeps the copy identical below its two-line header.
// `--check` fails instead of writing, for CI and `npm run check`.

import { readFileSync, writeFileSync } from 'node:fs'

const source = 'theme-studio/hooks/color.ts'
const target = 'neon-usage/hooks/color.ts'
const header = [
  '// Color math shared with Theme Studio (a verbatim copy of theme-studio/hooks/color.ts',
  '// below this header, kept in sync by `npm run sync:color`, so each plugin installs on its own).',
]

const body = readFileSync(source, 'utf8').split('\n').slice(2).join('\n')
const wanted = [...header, ...body.split('\n')].join('\n')

if (process.argv.includes('--check')) {
  if (readFileSync(target, 'utf8') !== wanted) {
    console.error(`${target} is out of sync with ${source}: run npm run sync:color`)
    process.exit(1)
  }
  console.log('color modules in sync')
} else {
  writeFileSync(target, wanted)
  console.log(`synced ${target}`)
}
