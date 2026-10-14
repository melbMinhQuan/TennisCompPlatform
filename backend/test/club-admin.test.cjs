const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { ClubAdminModule } = require('../dist/club-admin/club-admin.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')

// ── An in-memory world: Glen and Mount share a section; Mount alone is in the juniors.
const seniors = { id: 'comp-seniors', name: 'Weekend Senior', type: 'Adult', status: 'ACTIVE' }
const juniors = { id: 'comp-juniors', name: 'Junior Pennant', type: 'Junior', status: 'ACTIVE' }
const season = (id, competition, year) => ({ id, competitionId: competition.id, competition, seasonType: 'Winter', year, status: year === 2026 ? 'ACTIVE' : 'COMPLETED' })
const senior2026 = season('season-s-2026', seniors, 2026)
const senior2025 = season('season-s-2025', seniors, 2025)
const junior2026 = season('season-j-2026', juniors, 2026)
const section = (id, name, season) => ({ id, name, gender: null, ageGroup: 'Adult', seasonId: season.id, season })
const s1 = section('sec-s1', 'Section 1', senior2026)
const s1old = section('sec-s1-2025', 'Section 1', senior2025)
const j1 = section('sec-j1', 'Junior 1', junior2026)
const team = (id, name, clubId, sec) => ({ id, name, clubId, sectionId: sec.id, section: sec })
const teams = [
  team('team-glen-1', 'Glen Waverley 1', 'club-glen', s1),
  team('team-glen-1-old', 'Glen Waverley 1', 'club-glen', s1old),
  team('team-mount-1', 'Mount Waverley 1', 'club-mount', s1),
  team('team-mount-j1', 'Mount Waverley J1', 'club-mount', j1),
]
const users = {
  'admin.glen@admin.example': { id: 'user-glen-admin', email: 'admin.glen@admin.example' },
  'revoked@admin.example': { id: 'user-revoked', email: 'revoked@admin.example' },
  'chloe@club.example': { id: 'user-chloe', email: 'chloe@club.example' },
}
const roles = [
  { userId: 'user-glen-admin', roleType: 'CLUB_ADMIN', clubId: 'club-glen', revokedAt: null },
  { userId: 'user-revoked', roleType: 'CLUB_ADMIN', clubId: 'club-mount', revokedAt: new Date() },
  { userId: 'user-chloe', roleType: 'PLAYER', clubId: null, revokedAt: null },
]
const unique = rows => [...new Map(rows.map(row => [row.id, row])).values()]
// Each fake reads the club ID from where the service's filter puts it, so a
// query that dropped the club filter would return every club's rows.
const prisma = {
  user: { findUnique: async ({ where }) => users[where.email] ?? null },
  userRole: {
    findFirst: async ({ where }) => roles.find(r => r.userId === where.userId && r.roleType === where.roleType && r.revokedAt === null && r.clubId !== null) ?? null,
  },
  competition: {
    findMany: async ({ where }) => {
      const clubId = where?.seasons?.some?.sections?.some?.teams?.some?.clubId
      return unique(teams.filter(t => t.clubId === clubId).map(t => t.section.season.competition))
    },
  },
  sectionGrade: { findMany: async ({ where }) => unique(teams.filter(t => t.clubId === where?.teams?.some?.clubId).map(t => t.section)) },
  team: { findMany: async ({ where }) => teams.filter(t => t.clubId === where?.clubId) },
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
const get = async (path, email) => {
  const query = email === undefined ? '' : `?email=${encodeURIComponent(email)}`
  const response = await fetch(`${url}/api/v1/club-admin/${path}${query}`)
  return { status: response.status, body: await response.json() }
}
const ADMIN = 'admin.glen@admin.example'

test('I-CLUBADMIN-001: an admin sees only competitions their club has a team in', async () => {
  const { status, body } = await get('competitions', ADMIN)
  assert.equal(status, 200)
  assert.deepEqual(body.data, [{ id: 'comp-seniors', name: 'Weekend Senior', type: 'Adult', status: 'ACTIVE' }])
})

test('I-CLUBADMIN-002: sections carry their season and competition, and exclude other clubs\' sections', async () => {
  const { body } = await get('sections', ADMIN)
  assert.deepEqual(body.data.map(s => [s.id, s.seasonLabel, s.seasonStatus, s.competitionName]), [
    ['sec-s1', 'Winter 2026', 'ACTIVE', 'Weekend Senior'],
    ['sec-s1-2025', 'Winter 2025', 'COMPLETED', 'Weekend Senior'],
  ])
})

test('I-CLUBADMIN-003: teams are only the admin\'s club\'s, never a rival in the same section', async () => {
  const { body } = await get('teams', ADMIN)
  assert.deepEqual(body.data.map(t => t.id), ['team-glen-1', 'team-glen-1-old'])
  assert.deepEqual(
    { name: body.data[0].name, sectionName: body.data[0].sectionName, seasonLabel: body.data[0].seasonLabel },
    { name: 'Glen Waverley 1', sectionName: 'Section 1', seasonLabel: 'Winter 2026' },
  )
})

test('I-CLUBADMIN-004: the email is normalised before lookup', async () => {
  assert.equal((await get('teams', '  Admin.Glen@Admin.EXAMPLE ')).status, 200)
})

test('I-CLUBADMIN-005: a player or a revoked admin is refused with 403', async () => {
  for (const email of ['chloe@club.example', 'revoked@admin.example']) {
    const { status, body } = await get('teams', email)
    assert.equal(status, 403, email)
    assert.equal(body.code, 'NOT_CLUB_ADMIN', email)
  }
})

test('I-CLUBADMIN-006: a missing or malformed email is a 400 and an unknown one a 401', async () => {
  assert.equal((await get('teams')).status, 400)
  assert.equal((await get('teams', 'not-an-email')).status, 400)
  const { status, body } = await get('teams', 'ghost@admin.example')
  assert.equal(status, 401)
  assert.equal(body.code, 'UNAUTHENTICATED')
})

test('I-CLUBADMIN-007: routes are refused in production', async () => {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    const { status, body } = await get('teams', ADMIN)
    assert.equal(status, 403)
    assert.equal(body.code, 'DEMO_DISABLED')
  } finally {
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
  }
})

test('I-CLUBADMIN-008: a database failure is a 503 that leaks nothing', async () => {
  const original = prisma.team.findMany
  prisma.team.findMany = async () => { throw new Error('password=secret host=db.internal') }
  try {
    const { status, body } = await get('teams', ADMIN)
    assert.equal(status, 503)
    assert.equal(body.code, 'DATA_UNAVAILABLE')
    assert.ok(!JSON.stringify(body).includes('secret'))
  } finally {
    prisma.team.findMany = original
  }
})
