// Who may see a junior's details (docs/junior-privacy.md), checked through the real API on the
// real seeded data: the workbook is seeded into a transaction, the whole app runs against it, and
// everything is rolled back afterwards. JUNIOR-001..013 check the same rules on in-memory data.
//   npm run test:database --workspace=backend   (needs DATABASE_URL; builds first, as the app runs from dist)
const { test } = require('node:test')
const assert = require('node:assert/strict')
const path = require('node:path')
const XLSX = require('xlsx')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { PrismaClient, Prisma } = require('@prisma/client')
const { require: requireTs } = require('tsx/cjs/api')
const { seedCompetition } = requireTs('../prisma/seed-competition.ts', __filename)
const { AppModule } = require('../dist/app.module')
const { PrismaService } = require('../dist/prisma/prisma.service')

const book = XLSX.readFile(path.join(__dirname, '../prisma/competition_data.xlsx'))
const sheets = Object.fromEntries(book.SheetNames.map(name => [
  name, XLSX.utils.sheet_to_json(book.Sheets[name], { defval: '' }),
]))
const roleHolder = (roleType, extra = () => true) => sheets.UserRole.find(r => r.role_type === roleType && extra(r))._lookup_user_email

// The people whose view is being checked, all from the workbook.
const LEO = sheets.Player.find(p => p.first_name === 'Leo' && p.last_name === 'Fitzgerald')
const MAYA = 'maya.okafor@juniors.example' // Leo's teammate in Glen Waverley 18U
const PARENT_MANAGER = 'adaeze.okafor@families.example' // Maya's parent, manager of Glen Waverley 18U
const OTHER_MANAGER = 'lucia.rossi@families.example' // manager of Mount Waverley 18U
const OWN_CLUB_ADMIN = roleHolder('CLUB_ADMIN', r => r.club_id === 'CLB01') // Glen Waverley, Leo's club
const OTHER_CLUB_ADMIN = roleHolder('CLUB_ADMIN', r => r.club_id === 'CLB02') // Mount Waverley
const ASSOCIATION_ADMIN = roleHolder('ADMINISTRATOR')
const RECORDS_SECRETARY = roleHolder('RECORDS_SECRETARY')
const ADULT_PLAYER = 'chloe.cooper005@players.example'
// Everything about Leo that only he, his club and the association may see, and his parent's contact.
const LEO_OWN = [LEO.date_of_birth, LEO.phone, LEO._lookup_user_email]
const LEO_PARENT = [LEO.guardian_name, LEO.guardian_email, LEO.guardian_phone]

const absent = (body, secrets, who) => {
  const text = JSON.stringify(body)
  for (const secret of secrets) assert.equal(text.includes(secret), false, `${who} was shown ${secret}`)
}

test('JUNIOR-101..110: each role sees only what docs/junior-privacy.md allows, on the real seeded data', async t => {
  // Rolled back or not, a long serializable transaction would still hold up a shared database.
  const { hostname } = new URL(process.env.DATABASE_URL ?? 'missing://')
  assert.ok(['localhost', '127.0.0.1'].includes(hostname), 'Run this against a local database (set DATABASE_URL)')

  const db = new PrismaClient()
  const rollback = new Error('Roll back the junior privacy test')
  try {
    await db.$transaction(async tx => {
      await seedCompetition(tx, sheets, false)
      const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(PrismaService).useValue(tx).compile()
      const app = module.createNestApplication({ logger: false })
      app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true })) // as main.ts does
      await app.listen(0, '127.0.0.1')
      const url = await app.getUrl()
      const get = async (route, email, query = {}) => {
        const response = await fetch(`${url}/api/v1/${route}?${new URLSearchParams({ email, ...query })}`)
        return { status: response.status, body: await response.json() }
      }
      const leo = await tx.player.findFirstOrThrow({ where: { code: LEO.id } })
      const glen18 = await tx.team.findFirstOrThrow({ where: { name: 'Glen Waverley 18U' } })

      try {
        await t.test('JUNIOR-101: the junior, or their parent on the junior\'s login, sees the junior\'s own details', async () => {
          const { status, body } = await get('player-dashboard', LEO._lookup_user_email)
          assert.equal(status, 200)
          const { dateOfBirth, phone, email, isJunior, guardian } = body.data.profile
          assert.deepEqual({ dateOfBirth, phone, email, isJunior, guardian }, {
            dateOfBirth: LEO.date_of_birth, phone: LEO.phone, email: LEO._lookup_user_email, isJunior: true,
            guardian: { name: LEO.guardian_name, email: LEO.guardian_email, phone: LEO.guardian_phone },
          })
        })

        await t.test('JUNIOR-102: a teammate sees the junior\'s name on the team list, and nothing else', async () => {
          const { status, body } = await get(`player/teams/${glen18.id}`, MAYA)
          assert.equal(status, 200)
          assert.equal(body.data.viewerIsManager, false)
          const row = body.data.members.find(m => m.id === leo.id)
          assert.deepEqual(row, { id: leo.id, name: 'Leo Fitzgerald', status: 'ACTIVE', isCurrentPlayer: false })
          absent(body, [...LEO_OWN, ...LEO_PARENT, 'isJunior', 'guardian'], 'a teammate')
        })

        await t.test('JUNIOR-103: the team manager sees the junior\'s name and their parent\'s phone and email, not the junior\'s own', async () => {
          const memberships = (await get('player/memberships', PARENT_MANAGER)).body.data
          assert.deepEqual(memberships.managedTeams.map(team => team.name), ['Glen Waverley 18U'])
          const { status, body } = await get(`player/teams/${glen18.id}`, PARENT_MANAGER)
          assert.equal(status, 200)
          assert.equal(body.data.viewerIsManager, true)
          const row = body.data.members.find(m => m.id === leo.id)
          assert.deepEqual([row.name, row.isJunior, row.guardian], [
            'Leo Fitzgerald', true, { name: LEO.guardian_name, email: LEO.guardian_email, phone: LEO.guardian_phone },
          ])
          assert.ok(body.data.members.every(m => m.isJunior && m.guardian), 'every junior on the team has a parent to contact')
          absent(body, LEO_OWN, 'the team manager')
        })

        await t.test('JUNIOR-104: another team\'s manager, or an adult player not on the team, cannot open it', async () => {
          for (const email of [OTHER_MANAGER, ADULT_PLAYER]) {
            const { status, body } = await get(`player/teams/${glen18.id}`, email)
            assert.deepEqual([status, body.code], [404, 'TEAM_NOT_FOUND'], email)
            absent(body, [...LEO_OWN, ...LEO_PARENT], email)
          }
        })

        await t.test('JUNIOR-105: the junior\'s own club admin sees every detail, parent contact included', async () => {
          const { status, body } = await get(`club-admin/players/${leo.id}`, OWN_CLUB_ADMIN)
          assert.equal(status, 200)
          const { isJunior, dateOfBirth, email, phone, guardian } = body.data
          assert.deepEqual({ isJunior, dateOfBirth, email, phone, guardian }, {
            isJunior: true, dateOfBirth: LEO.date_of_birth, email: LEO._lookup_user_email, phone: LEO.phone,
            guardian: { name: LEO.guardian_name, email: LEO.guardian_email, phone: LEO.guardian_phone },
          })
          const squad = (await get(`club-admin/teams/${glen18.id}`, OWN_CLUB_ADMIN)).body.data.players
          assert.ok(squad.every(p => p.isJunior), 'the squad marks its juniors')
        })

        await t.test('JUNIOR-106: another club\'s admin cannot open the junior or their team, or find them on their list', async () => {
          for (const route of [`club-admin/players/${leo.id}`, `club-admin/teams/${glen18.id}`]) {
            const { status, body } = await get(route, OTHER_CLUB_ADMIN)
            assert.equal(status, 404, route)
            absent(body, [...LEO_OWN, ...LEO_PARENT], OTHER_CLUB_ADMIN)
          }
          const players = (await get('club-admin/players', OTHER_CLUB_ADMIN)).body.data
          assert.equal(players.some(p => p.id === leo.id), false)
        })

        await t.test('JUNIOR-107: another club\'s admin searching to add the junior sees only the name, with a tick or cross', async () => {
          const search = query => get('club-admin/registry/players', OTHER_CLUB_ADMIN, query)
          const right = await search({ name: 'Leo Fitzgerald', dateOfBirth: LEO.date_of_birth, playerEmail: LEO._lookup_user_email })
          const wrong = await search({ name: 'Leo Fitzgerald', dateOfBirth: '2009-11-15', playerEmail: 'leo@elsewhere.example' })
          for (const [result, expected] of [[right, true], [wrong, false]]) {
            assert.equal(result.status, 200)
            const match = result.body.data.find(p => p.id === leo.id)
            assert.deepEqual([match.firstName, match.lastName, match.isJunior, match.otherClubs], ['Leo', 'Fitzgerald', true, []])
            assert.deepEqual([match.match.dateOfBirth, match.match.email], [expected, expected])
            absent(result.body, [...LEO_OWN, ...LEO_PARENT, 'Glen Waverley'], OTHER_CLUB_ADMIN)
          }
        })

        await t.test('JUNIOR-108: the association admin sees every junior\'s details, age and eligibility', async () => {
          const { status, body } = await get('association-admin/juniors', ASSOCIATION_ADMIN)
          assert.equal(status, 200)
          const juniors = sheets.Player.filter(p => p.is_junior === true)
          assert.deepEqual(body.data.juniors.map(j => j.code).sort(), juniors.map(p => p.id).sort())
          const row = body.data.juniors.find(j => j.id === leo.id)
          assert.deepEqual([row.dateOfBirth, row.phone, row.email, row.guardian], [
            LEO.date_of_birth, LEO.phone, LEO._lookup_user_email, { name: LEO.guardian_name, email: LEO.guardian_email, phone: LEO.guardian_phone },
          ])
          // Ruby Achebe is too old for 12 & Under on purpose (see the workbook's README); everyone else fits.
          const checks = body.data.juniors.flatMap(j => j.teams.map(team => [`${j.firstName} ${j.lastName}`, team.sectionName, team.eligible]))
          assert.deepEqual(checks.filter(([, , eligible]) => eligible !== true), [['Ruby Achebe', '12 & Under', false]])
          assert.equal(checks.length, juniors.length)
        })

        await t.test('JUNIOR-109: nobody but the association admin can open the association\'s junior list', async () => {
          for (const email of [OWN_CLUB_ADMIN, PARENT_MANAGER, LEO._lookup_user_email, RECORDS_SECRETARY, ADULT_PLAYER]) {
            const { status, body } = await get('association-admin/juniors', email)
            assert.deepEqual([status, body.code], [403, 'NOT_ASSOCIATION_ADMIN'], email)
          }
        })

        await t.test('JUNIOR-110: a junior cannot be made a team manager, who would see other juniors\' parent contacts', async () => {
          // Glen Waverley 12U has no manager yet; Leo has a login and is an active member of the club.
          const glen12 = await tx.team.findFirstOrThrow({ where: { name: 'Glen Waverley 12U' } })
          const response = await fetch(`${url}/api/v1/club-admin/teams/${glen12.id}/manager?${new URLSearchParams({ email: OWN_CLUB_ADMIN })}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ playerId: leo.id }),
          })
          const body = await response.json()
          assert.deepEqual([response.status, body.code, body.reason], [422, 'MANAGER_NOT_ELIGIBLE', 'UNDER_18'])
          const role = await tx.userRole.findFirst({ where: { user: { email: LEO._lookup_user_email } } })
          assert.equal(role.roleType, 'PLAYER')
        })
      } finally {
        await app.close()
      }
      throw rollback
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable, timeout: 600_000 })
  } catch (error) {
    if (error !== rollback) throw error
  } finally {
    await db.$disconnect()
  }
})
