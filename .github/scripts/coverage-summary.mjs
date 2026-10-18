// Prints a Markdown coverage table for the CI run's summary page:
//   node .github/scripts/coverage-summary.mjs >> "$GITHUB_STEP_SUMMARY"
// Reads what `npm run test:coverage` wrote in each workspace. The minimums themselves are
// enforced there (backend/package.json and frontend/vite.config.ts), not here.
import { existsSync, readFileSync } from 'node:fs'

const BACKEND_LCOV = 'backend/lcov.info'
const FRONTEND_SUMMARY = 'frontend/coverage/coverage-summary.json'
const percent = (covered, total) => (total ? `${((100 * covered) / total).toFixed(1)}%` : 'n/a')

/** Totals from an lcov file: LH/LF lines, BRH/BRF branches, FNH/FNF functions. */
function backend() {
  const totals = { SF: 0, LH: 0, LF: 0, BRH: 0, BRF: 0, FNH: 0, FNF: 0 }
  for (const line of readFileSync(BACKEND_LCOV, 'utf8').split('\n')) {
    const [key, value] = line.split(':')
    if (key === 'SF') totals.SF++
    else if (key in totals) totals[key] += Number(value)
  }
  return {
    files: totals.SF,
    lines: percent(totals.LH, totals.LF),
    branches: percent(totals.BRH, totals.BRF),
    functions: percent(totals.FNH, totals.FNF),
  }
}

function frontend() {
  const summary = JSON.parse(readFileSync(FRONTEND_SUMMARY, 'utf8'))
  const { lines, branches, functions } = summary.total
  return {
    files: Object.keys(summary).length - 1,
    lines: percent(lines.covered, lines.total),
    branches: percent(branches.covered, branches.total),
    functions: percent(functions.covered, functions.total),
  }
}

const rows = [
  ['Backend (`backend/src`)', BACKEND_LCOV, backend],
  ['Frontend (application code)', FRONTEND_SUMMARY, frontend],
]
let measuredNothing = false
console.log('### Test coverage\n')
console.log('| | Lines | Branches | Functions | Files |')
console.log('| --- | ---: | ---: | ---: | ---: |')
for (const [name, file, read] of rows) {
  if (!existsSync(file)) {
    console.log(`| ${name} | not measured: the tests stopped before writing \`${file}\` | | | |`)
    continue
  }
  const result = read()
  // Zero files would read as 100%, so a filter that matches nothing must fail loudly instead.
  if (result.files === 0) measuredNothing = true
  console.log(`| ${name} | ${result.lines} | ${result.branches} | ${result.functions} | ${result.files} |`)
}
console.log('\nPages and most components are exercised by the end-to-end tests, which are not measured here.')

if (measuredNothing) {
  console.error('Coverage measured no files at all: check the coverage include/exclude settings.')
  process.exit(1)
}
