const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { AssociationAdminModule } = require('../dist/association-admin/association-admin.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')
const { guardianContact, sectionEligibility } = require('../dist/common/junior-privacy')
const { ageOn, melbourneToday } = require('../dist/dashboard/dashboard.query')

// ── An in-memory world: two associations, each with juniors. Nothing touches a real database.
const date = value => (value === null ? null : new Date(`${value}T00:00:00Z`))
const waverley = { id: 'assoc-waverley', name: 'Waverley Tennis' }
const eastern = { id: 'assoc-eastern', name: 'Eastern Districts Tennis' }
const clubs = {
  glen: { id: 'club-glen', name: 'Glen Waverley Tennis Club', associationId: waverley.id },
  mount: { id: 'club-mount', name: 'Mount Waverley Tennis Club', associationId: waverley.id },
  boxHill: { id: 'club-box-hill', name: 'Box Hill Tennis Club', associationId: eastern.id },
}
const competition = (id, name, association) => ({ id, name, associationId: association.id })
const weekendJunior = competition('comp-junior', 'Weekend Junior', waverley)
const easternJunior = competition('comp-eastern', 'Eastern Juniors', eastern)
const season = (id, comp, startDate) => ({
  id, competition: comp, seasonType: 'Summer', year: 2026, endDate: date('2027-03-20'), startDate: date(startDate), status: 'UPCOMING',
})
const summer = season('season-summer', weekendJunior, '2026-10-31')
const undated = season('season-undated', weekendJunior, null)
const section = (id, name, sectionSeason, minAge, maxAge) => ({ id, name, season: sectionSeason, minAge, maxAge })
const u18 = section('sec-18', '18 & Under', summer, null, 18)
const u12 = section('sec-12', '12 & Under', summer, null, 12)
const open = section('sec-open', 'Open', summer, null, null)
const u18Undated = section('sec-18-undated', '18 & Under', undated, null, 18)
const eastern14 = section('sec-eastern', '14 & Under', season('season-eastern', easternJunior, '2026-10-31'), null, 14)
const team = (id, name, club, teamSection) => ({ id, name, club, section: teamSection })
const glen18 = team('team-glen-18', 'Glen Waverley 18U', clubs.glen, u18)
const glen12 = team('team-glen-12', 'Glen Waverley 12U', clubs.glen, u12)
const glenOpen = team('team-glen-open', 'Glen Waverley Open', clubs.glen, open)
const glenUndated = team('team-glen-undated', 'Glen Waverley 18U', clubs.glen, u18Undated)
const boxHill14 = team('team-box-hill-14', 'Box Hill 14U', clubs.boxHill, eastern14)

const parent = (name, email, phone) => ({ guardianName: name, guardianEmail: email, guardianPhone: phone })
const person = (id, firstName, lastName, dateOfBirth, extra) => ({
  id, code: null, firstName, lastName, dateOfBirth: date(dateOfBirth), gender: 'FEMALE', status: 'ACTIVE', isJunior: true,
  phone: null, mergeIntoId: null, user: null, guardianName: null, guardianEmail: null, guardianPhone: null,
  associationIds: [], clubs: [], teams: [], ...extra,
})
const people = [
  person('leo', 'Leo', 'Fitzgerald', '2009-11-14', {
    code: 'PLR113', gender: 'MALE', phone: '0414 300 800', user: { email: 'leo.fitzgerald@juniors.example' },
    ...parent('Siobhan Fitzgerald', 'siobhan.fitzgerald@families.example', '0413 200 700'),
    associationIds: [waverley.id], clubs: [[clubs.glen, true]], teams: [glen18],
  }),
  // 13 on the season's first day: too old for 12 & Under. The open and undated sections have nothing to check.
  person('ruby', 'Ruby', 'Achebe', '2013-06-11', {
    ...parent('Chidi Achebe', 'chidi.achebe@families.example', '0413 208 708'),
    associationIds: [waverley.id], clubs: [[clubs.mount, false], [clubs.glen, true]], teams: [glen12, glenOpen, glenUndated],
  }),
  // A member of one of Waverley's clubs with no association membership on record, and a team in Eastern's competition.
  person('noah', 'Noah', 'Kowalski', '2010-01-30', { clubs: [[clubs.mount, true]], teams: [boxHill14] }),
  // Eastern's own junior, a merged-away duplicate and an adult: none of them are Waverley's juniors to list.
  person('kenji', 'Kenji', 'Saito', '2012-12-03', { associationIds: [eastern.id], clubs: [[clubs.boxHill, true]], teams: [boxHill14] }),
  person('leo-dup', 'Leo', 'Fitzgerald', '2009-11-14', { mergeIntoId: 'leo', associationIds: [waverley.id] }),
  person('adult', 'Ava', 'Clark', '1990-01-01', { isJunior: false, associationIds: [waverley.id], clubs: [[clubs.glen, true]] }),
]

const users = [
  { id: 'user-raj', email: 'raj.mitchell@players.example', profile: { firstName: 'Raj', lastName: 'Mitchell' } },
  { id: 'user-eastern', email: 'admin@easterndistricts.example', profile: null },
  { id: 'user-mia', email: 'mia.coleman@players.example', profile: { firstName: 'Mia', lastName: 'Coleman' } },
  { id: 'user-margaret', email: 'margaret.hayes@admin.example', profile: { firstName: 'Margaret', lastName: 'Hayes' } },
  { id: 'user-adaeze', email: 'adaeze.okafor@families.example', profile: { firstName: 'Adaeze', lastName: 'Okafor' } },
  { id: 'user-leo', email: 'leo.fitzgerald@juniors.example', profile: { firstName: 'Leo', lastName: 'Fitzgerald' } },
  { id: 'user-revoked', email: 'former.admin@players.example', profile: null },
]
const roles = [
  { userId: 'user-raj', roleType: 'ADMINISTRATOR', associationId: waverley.id, revokedAt: null },
  { userId: 'user-eastern', roleType: 'ADMINISTRATOR', associationId: eastern.id, revokedAt: null },
  { userId: 'user-mia', roleType: 'RECORDS_SECRETARY', associationId: waverley.id, revokedAt: null },
  { userId: 'user-margaret', roleType: 'CLUB_ADMIN', clubId: clubs.glen.id, associationId: null, revokedAt: null },
  { userId: 'user-adaeze', roleType: 'TEAM_MANAGER', teamId: glen18.id, associationId: null, revokedAt: null },
  { userId: 'user-leo', roleType: 'PLAYER', associationId: null, revokedAt: null },
  { userId: 'user-revoked', roleType: 'ADMINISTRATOR', associationId: waverley.id, revokedAt: new Date('2026-01-01') },
]

let databaseDown = false
const guard = value => { if (databaseDown) throw new Error('password=secret host=db.internal'); return value }
const belongsTo = (p, associationId) => p.associationIds.includes(associationId) || p.clubs.some(([club]) => club.associationId === associationId)
// The fake Prisma: just enough of each query the association admin routes make.
const prisma = {
  user: {
    findUnique: async ({ where }) => guard(users.find(u => u.email === where.email) ?? null),
    findUniqueOrThrow: async ({ where }) => users.find(u => u.id === where.id),
  },
  userRole: {
    findFirst: async ({ where }) => guard(roles.find(r => r.userId === where.userId && r.roleType === where.roleType
      && r.revokedAt === null && r.associationId !== null) ?? null),
  },
  association: { findUniqueOrThrow: async ({ where }) => [waverley, eastern].find(a => a.id === where.id) },
  player: {
    findMany: async ({ where, include }) => {
      const associationId = where.OR[0].associationMemberships.some.associationId
      assert.equal(where.OR[1].clubMemberships.some.club.associationId, associationId)
      const teamsAssociation = include.teamPlayers.where.team.section.season.competition.associationId
      return people
        .filter(p => p.isJunior === where.isJunior && p.mergeIntoId === where.mergeIntoId && belongsTo(p, associationId))
        .sort((a, b) => a.lastName.localeCompare(b.lastName))
        .map(p => ({
          ...p,
          clubMemberships: p.clubs.map(([club, isPrimary]) => ({ clubId: club.id, club, isPrimary, status: 'ACTIVE' })),
          teamPlayers: p.teams.filter(t => t.section.season.competition.associationId === teamsAssociation).map(t => ({ team: t, status: 'ACTIVE' })),
        }))
    },
  },
}

let app, url
before(async () => {
  const module = await Test.createTestingModule({ imports: [PrismaModule, AssociationAdminModule] }).overrideProvider(PrismaService).useValue(prisma).compile()
  app = module.createNestApplication({ logger: false })
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true })) // as main.ts does
  await app.listen(0, '127.0.0.1')
  url = await app.getUrl()
})
after(async () => { await app?.close() })
const RAJ = 'raj.mitchell@players.example'
const get = async (email, path = 'juniors') => {
  const query = email === undefined ? '' : `?email=${encodeURIComponent(email)}`
  const response = await fetch(`${url}/api/v1/association-admin/${path}${query}`)
  return { status: response.status, body: await response.json() }
}

test('JUNIOR-008: the association\'s administrator sees every detail of a junior, with age and the parent\'s contact', async () => {
  const { status, body } = await get(RAJ)
  assert.equal(status, 200)
  const today = melbourneToday()
  assert.deepEqual([body.data.asOf, body.data.association, body.data.adminName], [today, waverley, 'Raj Mitchell'])
  const leo = body.data.juniors.find(j => j.id === 'leo')
  assert.deepEqual(leo, {
    id: 'leo', code: 'PLR113', firstName: 'Leo', lastName: 'Fitzgerald', dateOfBirth: '2009-11-14',
    age: ageOn('2009-11-14', today), gender: 'MALE', status: 'ACTIVE',
    email: 'leo.fitzgerald@juniors.example', phone: '0414 300 800',
    guardian: { name: 'Siobhan Fitzgerald', email: 'siobhan.fitzgerald@families.example', phone: '0413 200 700' },
    clubs: [{ clubId: 'club-glen', name: 'Glen Waverley Tennis Club', isPrimary: true, status: 'ACTIVE' }],
    teams: [{
      teamId: 'team-glen-18', teamName: 'Glen Waverley 18U', clubName: 'Glen Waverley Tennis Club', competitionName: 'Weekend Junior',
      seasonLabel: 'Summer 2026/27', seasonStatus: 'UPCOMING', seasonStart: '2026-10-31', sectionName: '18 & Under', status: 'ACTIVE',
      minAge: null, maxAge: 18, ageOnSeasonStart: 16, eligible: true,
    }],
  })
  // Clubs are primary first.
  assert.deepEqual(body.data.juniors.find(j => j.id === 'ruby').clubs.map(c => c.name), ['Glen Waverley Tennis Club', 'Mount Waverley Tennis Club'])
})

test('JUNIOR-009: a junior too old for their section is flagged; a section with no limit, or a season with no start date, has nothing to check', async () => {
  const ruby = (await get(RAJ)).body.data.juniors.find(j => j.id === 'ruby')
  assert.deepEqual(ruby.teams.map(t => [t.teamName, t.sectionName, t.seasonStart, t.ageOnSeasonStart, t.eligible]), [
    ['Glen Waverley 12U', '12 & Under', '2026-10-31', 13, false],
    ['Glen Waverley Open', 'Open', '2026-10-31', 13, null],
    // Undated seasons sort last.
    ['Glen Waverley 18U', '18 & Under', null, null, null],
  ])
  // The limits are inclusive and taken on the first day: turning 13 the day after is still 12 & Under,
  // a 13th birthday on the first day is not. A minimum age counts too.
  assert.equal(sectionEligibility('2013-11-01', { minAge: null, maxAge: 12 }, '2026-10-31').eligible, true)
  assert.equal(sectionEligibility('2013-10-31', { minAge: null, maxAge: 12 }, '2026-10-31').eligible, false)
  assert.equal(sectionEligibility('2010-01-01', { minAge: 18, maxAge: null }, '2026-10-31').eligible, false)
  assert.equal(sectionEligibility('2000-01-01', { minAge: 18, maxAge: null }, '2026-10-31').eligible, true)
})

test('JUNIOR-010: only the association\'s own juniors and competitions are listed', async () => {
  const waverleyJuniors = (await get(RAJ)).body.data.juniors
  // Noah is found through his club alone; Kenji is Eastern's; the merged duplicate and the adult are not listed.
  assert.deepEqual(waverleyJuniors.map(j => j.id), ['ruby', 'leo', 'noah'])
  // Noah's team is in Eastern's competition, which is not Waverley's to check.
  assert.deepEqual(waverleyJuniors.find(j => j.id === 'noah').teams, [])
  // Eastern's administrator, who has no profile, sees Eastern's juniors and is named by their email.
  const easternView = (await get('admin@easterndistricts.example')).body.data
  assert.deepEqual([easternView.adminName, easternView.juniors.map(j => j.id)], ['admin@easterndistricts.example', ['kenji']])
  assert.deepEqual(easternView.juniors[0].teams.map(t => [t.teamName, t.eligible]), [['Box Hill 14U', true]])
})

test('JUNIOR-011: anyone but the association\'s administrator is refused, whatever else they are', async () => {
  for (const email of ['mia.coleman@players.example', 'margaret.hayes@admin.example', 'adaeze.okafor@families.example', 'leo.fitzgerald@juniors.example', 'former.admin@players.example']) {
    const { status, body } = await get(email)
    assert.equal(status, 403, email)
    assert.equal(body.code, 'NOT_ASSOCIATION_ADMIN', email)
    assert.equal(JSON.stringify(body).includes('Fitzgerald'), false, email)
  }
  assert.equal((await get('ghost@players.example')).status, 401)
  assert.equal((await get(undefined)).status, 400)
  assert.equal((await get('not-an-email')).status, 400)
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    const { status, body } = await get(RAJ)
    assert.deepEqual([status, body.code], [403, 'DEMO_DISABLED'])
  } finally {
    process.env.NODE_ENV = previous
  }
})

test('JUNIOR-012: a database failure is a 503 that leaks nothing', async () => {
  databaseDown = true
  try {
    const { status, body } = await get(RAJ)
    assert.equal(status, 503)
    assert.equal(JSON.stringify(body).includes('secret'), false)
  } finally {
    databaseDown = false
  }
})

test('JUNIOR-013: a parent contact is only ever a junior\'s, and only when one is recorded', () => {
  const contact = { guardianName: 'Pat Brown', guardianEmail: null, guardianPhone: '0413 200 700' }
  assert.deepEqual(guardianContact({ isJunior: true, ...contact }), { name: 'Pat Brown', email: null, phone: '0413 200 700' })
  assert.equal(guardianContact({ isJunior: false, ...contact }), null)
  assert.equal(guardianContact({ isJunior: true, guardianName: null, guardianEmail: null, guardianPhone: null }), null)
})
