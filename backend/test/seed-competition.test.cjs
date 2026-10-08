const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const XLSX = require('xlsx')
const { require: requireTs } = require('tsx/cjs/api')
const { seedCompetition } = requireTs('../prisma/seed-competition.ts', __filename)

test('SEED-001: deferred unique tables seed successfully and reruns preserve existing rows', async () => {
  const book = XLSX.readFile(path.join(__dirname, '../prisma/competition_data.xlsx'))
  const sheets = Object.fromEntries(book.SheetNames.map(name => [
    name, XLSX.utils.sheet_to_json(book.Sheets[name], { defval: '' }),
  ]))
  const stored = new Map()
  const deferred = new Set(['rubberSet', 'userRole'])
  const tx = new Proxy({}, {
    get: (_, name) => {
      if (!stored.has(name)) stored.set(name, new Map())
      const rows = stored.get(name)
      return {
        findMany: async ({ where }) => where.id.in.filter(id => rows.has(id)).map(id => ({ id })),
        createMany: async ({ data, skipDuplicates }) => {
          if (deferred.has(name)) {
            assert.ok(!skipDuplicates, `${name}: ON CONFLICT cannot use a deferred unique constraint`)
          }
          let count = 0
          for (const row of data) {
            if (rows.has(row.id)) {
              assert.ok(skipDuplicates, `${name}: duplicate primary key`)
              continue
            }
            rows.set(row.id, row)
            count++
          }
          return { count }
        },
      }
    },
  })

  const first = await seedCompetition(tx, sheets, false)
  for (const name of deferred) assert.ok(first.inserted[name] > 0)
  const role = stored.get('userRole').values().next().value
  role.roleType = 'hand-edited role'

  const second = await seedCompetition(tx, sheets, false)
  assert.ok(Object.values(second.inserted).every(count => count === 0))
  assert.equal(stored.get('userRole').get(role.id).roleType, 'hand-edited role')
})
