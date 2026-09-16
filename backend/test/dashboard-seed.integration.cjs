// Run explicitly against the local dev DB. All seed/test writes roll back.
// node --env-file=backend/.env --import tsx --test backend/test/dashboard-seed.integration.cjs
const { test } = require('node:test')
const assert = require('node:assert/strict')
const { createHash } = require('node:crypto')
const { PrismaClient, Prisma } = require('@prisma/client')
const { seedDashboard, readEntries, demoId } = require('../prisma/seed-dashboard.ts')

async function counts(db) {
  const result = {}
  for (const model of Prisma.dmmf.datamodel.models) {
    result[model.name] = await db[model.name[0].toLowerCase() + model.name.slice(1)].count()
  }
  return result
}
async function accountDigest(db) {
  // Never print User data (including password hashes), even if an assertion fails.
  const rows = await db.user.findMany({ orderBy: { id: 'asc' } })
  return createHash('sha256').update(JSON.stringify(rows)).digest('hex')
}

test('dashboard seed links accounts, builds complete matches, preserves edits and reruns without duplicates', async () => {
  assert.notEqual(process.env.NODE_ENV, 'production')
  const db = new PrismaClient()
  const entries = readEntries()
  const rollback = new Error('Intentional rollback after seed checks')
  try {
    const before = await counts(db)
    const usersBefore = await accountDigest(db)
    try {
      await db.$transaction(async tx => {
        const dry = await seedDashboard(tx, entries, true)
        assert.equal(dry.matchedUsers, 100)
        assert.deepEqual(await counts(tx), before, 'Dry run must not change records')
        const first = await seedDashboard(tx, entries)
        const afterSeed = await counts(tx)
        assert.equal(afterSeed.Player, before.Player + first.inserted.players)
        assert.equal(await tx.user.count({ where: { email: { in: entries.map(e => e.email) }, player: { isNot: null } } }), 100)

        const users = await tx.user.findMany({ where: { email: { in: entries.map(e => e.email) } }, include: { player: true } })
        const seeded = users.filter(u => u.player?.id === demoId(`player:${u.id}`))
        assert.ok(seeded.length, 'Test requires at least one eligible demo profile')
        const player = seeded[0].player
        assert.equal(await tx.clubMembership.count({ where: { playerId: player.id, isPrimary: true } }), 1)
        assert.equal(await tx.utrLink.count({ where: { playerId: player.id } }), 1)
        // The original empty database produces four completed personal matches per player.
        if (seeded.length === 100) {
          for (const user of seeded) {
            assert.equal(await tx.rubberPlayer.count({ where: { playerId: user.player.id } }), 4)
          }
          assert.equal(await tx.fixture.count({ where: { sectionId: demoId('section'), status: 'SCHEDULED' } }), 20)
          assert.equal(await tx.rubber.count({ where: { matchFormatId: demoId('format') } }), 160)
          const fixtures = await tx.fixture.findMany({ where: { sectionId: demoId('section'), status: 'COMPLETED' }, include: { matchResult: { include: { rubbers: { include: { rubberPlayers: true, rubberSets: true } } } } } })
          for (const fixture of fixtures) {
            const result = fixture.matchResult
            assert.equal(result.homeRubbers + result.awayRubbers, result.rubbers.length)
            for (const rubber of result.rubbers) {
              assert.equal(rubber.rubberPlayers.length, rubber.rubberType === 'SINGLES' ? 2 : 4)
              assert.equal(rubber.rubberSets.length, 2)
            }
          }
        }
        // Demonstrate preservation of manually edited seed records; these edits roll back too.
        await tx.player.update({ where: { id: player.id }, data: { firstName: 'Preserved edit' } })
        await tx.utrLink.update({ where: { playerId: player.id }, data: { utrRating: '8.88' } })
        const second = await seedDashboard(tx, entries)
        assert.ok(Object.values(second.inserted).every(value => value === 0))
        assert.equal(second.anchorDate, first.anchorDate)
        assert.deepEqual(await counts(tx), afterSeed)
        assert.equal((await tx.player.findUnique({ where: { id: player.id } })).firstName, 'Preserved edit')
        assert.equal((await tx.utrLink.findUnique({ where: { playerId: player.id } })).utrRating.toString(), '8.88')
        assert.equal(await accountDigest(tx), usersBefore, 'Users/passwords must never change')
        throw rollback
      }, { timeout: 60000 })
    } catch (error) { if (error !== rollback) throw error }
    assert.deepEqual(await counts(db), before, 'Integration test must leave all table counts unchanged')
    assert.equal(await accountDigest(db), usersBefore)
  } finally { await db.$disconnect() }
})
