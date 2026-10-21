const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const XLSX = require('xlsx')
const { require: requireTs } = require('tsx/cjs/api')
const { seedCompetition } = requireTs('../prisma/seed-competition.ts', __filename)

const book = XLSX.readFile(path.join(__dirname, '../prisma/competition_data.xlsx'))
const sheets = Object.fromEntries(book.SheetNames.map(name => [
  name, XLSX.utils.sheet_to_json(book.Sheets[name], { defval: '' }),
]))

const deferred = new Set(['rubberSet'])

/** An in-memory stand-in for the transaction: table name -> (id -> row). */
function fakeTx(stored) {
  return new Proxy({}, {
    get: (_, name) => {
      if (!stored.has(name)) stored.set(name, new Map())
      const rows = stored.get(name)
      return {
        // Only the filters the seed sends: id in / not in, code equal to / in.
        findMany: async ({ where }) => [...rows.values()]
          .filter(row => (!where.id.in || where.id.in.includes(row.id)) && (!where.id.notIn || !where.id.notIn.includes(row.id))
            && (!('code' in where) || (where.code?.in ? where.code.in.includes(row.code) : row.code === where.code)))
          .map(row => ({ id: row.id, code: row.code })),
        update: async ({ where, data }) => Object.assign(rows.get(where.id), data),
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
}

test('SEED-001: deferred unique tables seed successfully and reruns preserve existing rows', async () => {
  const stored = new Map()
  const tx = fakeTx(stored)

  const first = await seedCompetition(tx, sheets, false)
  for (const name of deferred) assert.ok(first.inserted[name] > 0)
  const role = stored.get('userRole').values().next().value
  role.roleType = 'hand-edited role'

  const second = await seedCompetition(tx, sheets, false)
  assert.ok(Object.values(second.inserted).every(count => count === 0))
  assert.equal(stored.get('userRole').get(role.id).roleType, 'hand-edited role')
})

test('SEED-003: clubs and players keep their workbook IDs, and older rows get them filled in', async () => {
  const stored = new Map()
  const tx = fakeTx(stored)
  await seedCompetition(tx, sheets, false)
  const club = sheets.Club[0]
  const player = sheets.Player.find(p => p.id === 'PLR005')
  const byCode = (table, code) => [...stored.get(table).values()].find(r => r.code === code)
  assert.equal(byCode('club', club.id).name, club.name)
  assert.equal(byCode('player', 'PLR005').firstName, player.first_name)

  // A database seeded before the column existed: codes empty, one name edited by hand.
  for (const table of ['club', 'player']) for (const row of stored.get(table).values()) row.code = null
  const edited = byCode('player', null)
  edited.firstName = 'Hand-edited name'
  const rerun = await seedCompetition(tx, sheets, false)
  assert.deepEqual(rerun.codesFilled, { club: sheets.Club.length, player: sheets.Player.length })
  assert.ok(Object.values(rerun.inserted).every(count => count === 0))
  assert.equal(byCode('player', 'PLR005').firstName, player.first_name)
  assert.equal(edited.firstName, 'Hand-edited name', 'filling the code leaves the rest of the row alone')
  assert.ok(edited.code, 'the edited row got its code too')

  const third = await seedCompetition(tx, sheets, false)
  assert.deepEqual(third.codesFilled, { club: 0, player: 0 })
})

test('SEED-004: a workbook code already taken by a player added through the app stops the seed', async () => {
  const stored = new Map()
  const tx = fakeTx(stored)
  await seedCompetition(tx, sheets, false)
  // The app gave its new player the next free code, and the workbook has since given it out too.
  const [firstCode] = sheets.Player.map(p => p.id)
  const workbookRow = [...stored.get('player').values()].find(r => r.code === firstCode)
  stored.get('player').delete(workbookRow.id)
  stored.get('player').set('added-in-app', { id: 'added-in-app', code: firstCode })
  await assert.rejects(seedCompetition(tx, sheets, false), new RegExp(`player ${firstCode} already belong\\(s\\) to a player added through the app`))
})
