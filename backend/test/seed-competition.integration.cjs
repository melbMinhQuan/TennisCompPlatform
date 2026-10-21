// Seeds a real Postgres database twice, so its actual unique constraints decide what counts as a
// duplicate (SEED-001 uses an in-memory stand-in). Everything is rolled back afterwards.
//   npm run test:database --workspace=backend   (needs DATABASE_URL; CI runs it on an empty database)
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const XLSX = require('xlsx')
const { PrismaClient, Prisma } = require('@prisma/client')
const { require: requireTs } = require('tsx/cjs/api')
const { seedCompetition } = requireTs('../prisma/seed-competition.ts', __filename)

const book = XLSX.readFile(path.join(__dirname, '../prisma/competition_data.xlsx'))
const sheets = Object.fromEntries(book.SheetNames.map(name => [
  name, XLSX.utils.sheet_to_json(book.Sheets[name], { defval: '' }),
]))

/** Rows in every table, so a second run that adds anything anywhere shows up. */
async function counts(db) {
  const result = {}
  for (const model of Prisma.dmmf.datamodel.models) {
    result[model.name] = await db[model.name[0].toLowerCase() + model.name.slice(1)].count()
  }
  return result
}

test('SEED-002: seeding a real database a second time adds no players, or any other row', async () => {
  // Rolled back or not, a long serializable transaction would still hold up a shared database.
  const { hostname } = new URL(process.env.DATABASE_URL ?? 'missing://')
  assert.ok(['localhost', '127.0.0.1'].includes(hostname), 'Run this against a local database (set DATABASE_URL)')

  const db = new PrismaClient()
  const rollback = new Error('Roll back the seed test')
  try {
    await db.$transaction(async tx => {
      await seedCompetition(tx, sheets, false)
      const afterFirstRun = await counts(tx)
      assert.ok(afterFirstRun.Player >= sheets.Player.length, 'every player in the workbook is in the database')

      const second = await seedCompetition(tx, sheets, false)
      const added = Object.entries(second.inserted).filter(([, n]) => n > 0)
      assert.deepEqual(added, [], 'the second run inserted rows')
      assert.deepEqual(await counts(tx), afterFirstRun)
      throw rollback
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 600_000 })
  } catch (error) {
    if (error !== rollback) throw error
  } finally {
    await db.$disconnect()
  }
})

test('SEED-005: a player or club added without a code gets the next free one from the database', async () => {
  const { hostname } = new URL(process.env.DATABASE_URL ?? 'missing://')
  assert.ok(['localhost', '127.0.0.1'].includes(hostname), 'Run this against a local database (set DATABASE_URL)')

  const highest = (rows, prefix) => Math.max(...rows.map(r => Number(String(r.id).slice(prefix.length))))
  const nextPlayer = highest(sheets.Player, 'PLR') + 1
  const nextClub = highest(sheets.Club, 'CLB') + 1
  const pad = (n, width) => String(n).padStart(width, '0')

  const db = new PrismaClient()
  const rollback = new Error('Roll back the code test')
  try {
    await db.$transaction(async tx => {
      await seedCompetition(tx, sheets, false)
      const person = { lastName: 'Code', dateOfBirth: new Date('2000-01-01'), gender: 'FEMALE' }

      // One at a time, as the Add player page does.
      const added = await tx.player.create({ data: { firstName: 'First', ...person } })
      assert.equal(added.code, `PLR${pad(nextPlayer, 3)}`)

      // Several in one statement, as the demo seed does: numbered one after another.
      await tx.player.createMany({ data: [{ firstName: 'Second', ...person }, { firstName: 'Third', ...person }] })
      const batch = await tx.player.findMany({ where: { lastName: 'Code', firstName: { in: ['Second', 'Third'] } }, orderBy: { code: 'asc' } })
      assert.deepEqual(batch.map(p => p.code), [`PLR${pad(nextPlayer + 1, 3)}`, `PLR${pad(nextPlayer + 2, 3)}`])

      // A code given on insert is kept, and the next free number follows it.
      assert.equal((await tx.player.create({ data: { firstName: 'Given', code: 'PLR4000', ...person } })).code, 'PLR4000')
      assert.equal((await tx.player.create({ data: { firstName: 'After', ...person } })).code, 'PLR4001')

      const associationId = (await tx.association.findFirstOrThrow()).id
      const club = await tx.club.create({ data: { associationId, name: 'Code Test Tennis Club' } })
      assert.equal(club.code, `CLB${pad(nextClub, 2)}`)
      throw rollback
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 600_000 })
  } catch (error) {
    if (error !== rollback) throw error
  } finally {
    await db.$disconnect()
  }
})
