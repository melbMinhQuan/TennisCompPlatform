const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { ClubAdminModule } = require('../dist/club-admin/club-admin.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')

// Route IDs must be UUIDs.
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const [PLAYED, AWAY_PENDING, POSTPONED, FINAL, DRAFT, RIVALS] = [1, 2, 3, 4, 5, 6].map(id)

const users = [
  { id: 'user-admin', email: 'admin.glen@admin.example' },
  { id: 'user-chloe', email: 'chloe@club.example' },
]
const roles = [
  { userId: 'user-admin', roleType: 'CLUB_ADMIN', clubId: 'club-glen', revokedAt: null },
  { userId: 'user-chloe', roleType: 'PLAYER', clubId: null, revokedAt: null },
]

const team = (teamId, name, clubId) => ({ id: teamId, name, clubId })
const glenA = team('team-glen-a', 'Glen Waverley A', 'club-glen')
const syndal = team('team-syndal-a', 'Syndal A', 'club-syndal')
const mount = team('team-mount-a', 'Mount Waverley A', 'club-mount')
const winter = { id: 'season-w26', seasonType: 'Winter', year: 2026, endDate: null, competition: { name: 'Weekend Senior' } }
const summer = { id: 'season-s26', seasonType: 'Summer', year: 2026, endDate: new Date('2027-03-20'), competition: { name: 'Weekend Senior' } }
const section = (name, season) => ({ name, season })
const player = (firstName, lastName) => ({ player: { firstName, lastName } })

// A rubber as Prisma returns it with the service's include: players and sets already in order.
const rubber = (rubberId, rubberNumber, rubberType, outcomeType, players, sets) => ({
  id: rubberId, rubberNumber, rubberType, outcomeType,
  rubberPlayers: players.map(([side, firstName, lastName]) => ({ side, ...player(firstName, lastName) })),
  rubberSets: sets.map(([setNumber, homeGames, awayGames]) => ({ setNumber, homeGames, awayGames })),
})
const fixture = (fixtureId, extra) => ({
  id: fixtureId, homeTeam: glenA, awayTeam: syndal, venue: { name: 'Glen Waverley Tennis Centre', address: '20 Reserve Road' },
  section: section('Section 1', winter), roundNumber: 1, roundLabel: null,
  scheduleDate: new Date('2026-05-02T00:00:00Z'), scheduleTime: new Date('1970-01-01T13:00:00Z'),
  status: 'SCHEDULED', _count: { scheduleChanges: 0 }, matchResult: null, ...extra,
})
const fixtures = [
  fixture(PLAYED, {
    status: 'COMPLETED',
    matchResult: {
      status: 'FINALISED', homeRubbers: 2, awayRubbers: 1,
      rubbers: [
        rubber('rub-1', 1, 'DOUBLES', 'COMPLETED', [['HOME', 'Charlotte', 'Reed'], ['HOME', 'Yuki', 'Smith'], ['AWAY', 'Tara', 'Barnes'], ['AWAY', 'Hannah', 'Bennett']], [[1, 6, 3], [2, 6, 4]]),
        rubber('rub-2', 2, 'SINGLES', 'RETIRED', [['HOME', 'Ethan', 'Wright'], ['AWAY', 'Mia', 'Rivera']], [[1, 2, 6], [2, null, null]]),
        // A rubber and a set without a number still get one from their position.
        rubber('rub-3', null, 'SINGLES', null, [['HOME', 'Chloe', 'Cooper'], ['AWAY', 'Thomas', 'Wood']], [[null, 7, 5]]),
      ],
    },
  }),
  fixture(AWAY_PENDING, {
    homeTeam: mount, awayTeam: glenA, venue: null, roundNumber: 2, status: 'COMPLETED',
    matchResult: { status: 'PENDING_CONFIRMATION', homeRubbers: null, awayRubbers: null, rubbers: [] },
  }),
  fixture(POSTPONED, { roundNumber: 3, scheduleDate: null, scheduleTime: null, status: 'POSTPONED', _count: { scheduleChanges: 2 } }),
  fixture(FINAL, { section: section('Section 2', summer), roundNumber: null, roundLabel: 'Grand Final' }),
  fixture(DRAFT, { roundNumber: null, status: 'COMPLETED', matchResult: { status: 'DRAFT', homeRubbers: 3, awayRubbers: 0, rubbers: [] } }),
  fixture(RIVALS, { homeTeam: mount, awayTeam: syndal }),
]

// The fake applies the club filter exactly where the service puts it, so a
// query that dropped it would return the rivals' fixture.
const involves = (row, where) => where.OR.some(side => row[Object.keys(side)[0]].clubId === Object.values(side)[0].clubId)
let lastFindMany
const prisma = {
  user: { findUnique: async ({ where }) => users.find(u => u.email === where.email) ?? null },
  userRole: {
    findFirst: async ({ where }) => roles.find(r => r.userId === where.userId && r.roleType === where.roleType && r.revokedAt === null && r.clubId !== null) ?? null,
  },
  fixture: {
    findMany: async args => { lastFindMany = args; return fixtures.filter(row => involves(row, args.where)) },
    findFirst: async ({ where }) => fixtures.find(row => row.id === where.id && involves(row, where)) ?? null,
  },
}

let app, url
before(async () => {
  const module = await Test.createTestingModule({ imports: [PrismaModule, ClubAdminModule] }).overrideProvider(PrismaService).useValue(prisma).compile()
  app = module.createNestApplication({ logger: false })
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true })) // as main.ts does
  await app.listen(0, '127.0.0.1')
  url = await app.getUrl()
})
after(async () => { await app?.close() })

const ADMIN = 'admin.glen@admin.example'
async function get(path, email = ADMIN) {
  const response = await fetch(`${url}/api/v1/club-admin/${path}?email=${encodeURIComponent(email)}`)
  return { status: response.status, body: await response.json() }
}

test('I-CLUBFIX-001: the list is every fixture a club team plays in, home or away, never other clubs\' matches', async () => {
  const { status, body } = await get('fixtures')
  assert.equal(status, 200)
  assert.deepEqual(body.data.map(f => f.id), [PLAYED, AWAY_PENDING, POSTPONED, FINAL, DRAFT])
  assert.deepEqual(lastFindMany.where, { OR: [{ homeTeam: { clubId: 'club-glen' } }, { awayTeam: { clubId: 'club-glen' } }] })
  // Soonest first; the database puts undated fixtures last.
  assert.deepEqual(lastFindMany.orderBy, [{ scheduleDate: 'asc' }, { scheduleTime: 'asc' }, { id: 'asc' }])
})

test('I-CLUBFIX-002: a fixture has the page\'s shape, with its result, rubbers and set scores home first', async () => {
  const { body } = await get('fixtures')
  assert.deepEqual(body.data[0], {
    id: PLAYED, clubId: 'club-glen', homeTeam: glenA, awayTeam: syndal,
    competition: 'Weekend Senior', seasonId: 'season-w26', seasonLabel: 'Winter 2026', section: 'Section 1', round: 'Round 1',
    date: '2026-05-02', time: '13:00', status: 'COMPLETED', changed: false,
    venue: { name: 'Glen Waverley Tennis Centre', address: '20 Reserve Road' },
    result: {
      status: 'FINALISED', homeRubbers: 2, awayRubbers: 1,
      rubbers: [
        { id: 'rub-1', number: 1, type: 'DOUBLES', outcome: 'COMPLETED', homePlayers: ['Charlotte Reed', 'Yuki Smith'], awayPlayers: ['Tara Barnes', 'Hannah Bennett'], sets: [{ number: 1, home: 6, away: 3 }, { number: 2, home: 6, away: 4 }] },
        { id: 'rub-2', number: 2, type: 'SINGLES', outcome: 'RETIRED', homePlayers: ['Ethan Wright'], awayPlayers: ['Mia Rivera'], sets: [{ number: 1, home: 2, away: 6 }, { number: 2, home: null, away: null }] },
        { id: 'rub-3', number: 3, type: 'SINGLES', outcome: null, homePlayers: ['Chloe Cooper'], awayPlayers: ['Thomas Wood'], sets: [{ number: 1, home: 7, away: 5 }] },
      ],
    },
  })
})

test('I-CLUBFIX-003: away games, postponements, finals and unsubmitted results show as they are', async () => {
  const byId = Object.fromEntries((await get('fixtures')).body.data.map(f => [f.id, f]))
  const away = byId[AWAY_PENDING]
  assert.deepEqual([away.homeTeam.clubId, away.awayTeam.clubId, away.venue], ['club-mount', 'club-glen', null])
  assert.deepEqual(away.result, { status: 'PENDING_CONFIRMATION', homeRubbers: null, awayRubbers: null, rubbers: [] })
  const postponed = byId[POSTPONED]
  assert.deepEqual([postponed.status, postponed.date, postponed.time, postponed.changed, postponed.result], ['POSTPONED', null, null, true, null])
  assert.deepEqual([byId[FINAL].round, byId[FINAL].seasonLabel, byId[FINAL].section], ['Grand Final', 'Summer 2026/27', 'Section 2'])
  // A DRAFT has not been submitted, so the club sees no result yet.
  assert.deepEqual([byId[DRAFT].round, byId[DRAFT].result], ['Round to be confirmed', null])
})

test('I-CLUBFIX-004: a fixture\'s detail has the same shape; another club\'s or an unknown fixture is a 404', async () => {
  const list = (await get('fixtures')).body.data
  const { status, body } = await get(`fixtures/${PLAYED}`)
  assert.equal(status, 200)
  assert.deepEqual(body.data, list[0])
  for (const fixtureId of [RIVALS, id(99)]) {
    const other = await get(`fixtures/${fixtureId}`)
    assert.equal(other.status, 404, fixtureId)
    assert.equal(other.body.code, 'FIXTURE_NOT_FOUND')
  }
  assert.equal((await get('fixtures/FIX0001')).status, 400)
})

test('I-CLUBFIX-005: a player gets 403 and a database failure is a 503 that leaks nothing', async () => {
  for (const path of ['fixtures', `fixtures/${PLAYED}`]) {
    const { status, body } = await get(path, 'chloe@club.example')
    assert.equal(status, 403, path)
    assert.equal(body.code, 'NOT_CLUB_ADMIN')
  }
  const original = prisma.fixture.findFirst
  prisma.fixture.findFirst = async () => { throw new Error('password=secret host=db.internal') }
  try {
    const { status, body } = await get(`fixtures/${PLAYED}`)
    assert.equal(status, 503)
    assert.equal(body.code, 'DATA_UNAVAILABLE')
    assert.ok(!JSON.stringify(body).includes('secret'))
  } finally {
    prisma.fixture.findFirst = original
  }
})
