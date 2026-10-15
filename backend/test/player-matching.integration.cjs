// The matcher and the duplicate scan on a real Postgres database holding the seeded test data:
// real case-insensitive team names, season dates and relations, and 112 real profiles to raise
// no false alarm on. The data is seeded inside a transaction that is rolled back afterwards.
//   npm run test:database --workspace=backend   (needs DATABASE_URL; CI runs it on an empty database)
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const XLSX = require('xlsx')
const { PrismaClient, Prisma } = require('@prisma/client')
const { require: requireTs } = require('tsx/cjs/api')
const { seedCompetition } = requireTs('../prisma/seed-competition.ts', __filename)
const { PlayerMatchingService } = requireTs('../src/player-matching/player-matching.service.ts', __filename)

const book = XLSX.readFile(path.join(__dirname, '../prisma/competition_data.xlsx'))
const sheets = Object.fromEntries(book.SheetNames.map(name => [
  name, XLSX.utils.sheet_to_json(book.Sheets[name], { defval: '' }),
]))

/** Runs `check` against freshly seeded test data, then rolls every change back. */
async function withSeededData(check) {
  // Rolled back or not, a long serializable transaction would still hold up a shared database.
  const { hostname } = new URL(process.env.DATABASE_URL ?? 'missing://')
  assert.ok(['localhost', '127.0.0.1'].includes(hostname), 'Run this against a local database (set DATABASE_URL)')
  const db = new PrismaClient()
  const rollback = new Error('Roll back the matching test')
  try {
    await db.$transaction(async tx => {
      await seedCompetition(tx, sheets, false)
      await check(tx, new PlayerMatchingService(tx))
      throw rollback
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 600_000 })
  } catch (error) {
    if (error !== rollback) throw error
  } finally {
    await db.$disconnect()
  }
}

test('MATCH-005: on the seeded data, "Tom Mitchell" on one of Thomas Mitchell\'s scoresheets is Thomas Mitchell', async () => {
  await withSeededData(async (tx, matching) => {
    const thomas = await tx.player.findFirstOrThrow({ where: { firstName: 'Thomas', lastName: 'Mitchell' } })
    const { team } = await tx.teamPlayer.findFirstOrThrow({
      where: { playerId: thomas.id },
      select: { team: { select: { name: true, section: { select: { season: { select: { startDate: true } } } } } } },
    })
    const scoresheet = { name: 'Tom Mitchell', teamName: team.name.toUpperCase(), matchDate: team.section.season.startDate }
    const found = await matching.matchRecordedPlayer(scoresheet)
    assert.equal(found.status, 'matched')
    assert.equal(found.playerId, thomas.id)
    assert.ok(found.reasons.includes('Tom is a nickname for Thomas'))
    assert.equal((await matching.matchRecordedPlayer({ ...scoresheet, dateOfBirth: '1900-01-01' })).status, 'unmatched')
  })
})

test('DUP-003: the seeded profiles raise no false alarm; registering Thomas Mitchell again as "Tom" raises one request, once', async () => {
  await withSeededData(async (tx, matching) => {
    // Includes the two Hiro Mitchells and two Amelia Lees, who are different people.
    assert.deepEqual(await matching.findDuplicateProfiles(), [])

    const thomas = await tx.player.findFirstOrThrow({ where: { firstName: 'Thomas', lastName: 'Mitchell' } })
    const tom = await tx.player.create({ data: { firstName: 'Tom', lastName: 'Mitchell', dateOfBirth: thomas.dateOfBirth, gender: thomas.gender } })
    const raised = await matching.raiseMergeRequests()
    assert.deepEqual(raised.map(pair => [pair.playerAId, pair.playerBId].sort()), [[thomas.id, tom.id].sort()])
    assert.equal(await tx.profileMergeRequest.count({ where: { status: 'PENDING', OR: [{ playerAId: tom.id }, { playerBId: tom.id }] } }), 1)
    assert.deepEqual(await matching.raiseMergeRequests(), [])
  })
})
