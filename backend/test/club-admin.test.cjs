const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { ClubAdminModule } = require('../dist/club-admin/club-admin.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')

// Route IDs must be UUIDs.
const GLEN_TEAM = '00000000-0000-4000-8000-000000000001'
const MOUNT_TEAM = '00000000-0000-4000-8000-000000000003'
const AVA = '00000000-0000-4000-8000-0000000000a1'
const BEN = '00000000-0000-4000-8000-0000000000b1'
const CARA = '00000000-0000-4000-8000-0000000000c1'
const MARGARET = '00000000-0000-4000-8000-0000000000d1'
const MOUNT_ONLY = '00000000-0000-4000-8000-0000000000e1'

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
  team(GLEN_TEAM, 'Glen Waverley 1', 'club-glen', s1),
  team('team-glen-1-old', 'Glen Waverley 1', 'club-glen', s1old),
  team(MOUNT_TEAM, 'Mount Waverley 1', 'club-mount', s1),
  team('team-mount-j1', 'Mount Waverley J1', 'club-mount', j1),
]
const users = {
  'admin.glen@admin.example': { id: 'user-glen-admin', email: 'admin.glen@admin.example' },
  'revoked@admin.example': { id: 'user-revoked', email: 'revoked@admin.example' },
  'chloe@club.example': { id: 'user-chloe', email: 'chloe@club.example' },
}
const roles = [
  { userId: 'user-glen-admin', roleType: 'CLUB_ADMIN', clubId: 'club-glen', associationId: null, revokedAt: null },
  { userId: 'user-revoked', roleType: 'CLUB_ADMIN', clubId: 'club-mount', associationId: null, revokedAt: new Date() },
  { userId: 'user-chloe', roleType: 'PLAYER', clubId: null, associationId: null, revokedAt: null },
  { userId: 'user-raj', roleType: 'ADMINISTRATOR', clubId: null, associationId: 'assoc-waverley', revokedAt: null, player: { firstName: 'Raj', lastName: 'Mitchell' } },
  { userId: 'user-old-sec', roleType: 'RECORDS_SECRETARY', clubId: null, associationId: 'assoc-waverley', revokedAt: new Date(), player: { firstName: 'Old', lastName: 'Secretary' } },
  { userId: 'user-mia', roleType: 'RECORDS_SECRETARY', clubId: null, associationId: 'assoc-waverley', revokedAt: null, player: { firstName: 'Mia', lastName: 'Coleman' } },
  { userId: 'user-other-admin', roleType: 'ADMINISTRATOR', clubId: null, associationId: 'assoc-other', revokedAt: null, player: { firstName: 'Other', lastName: 'Admin' } },
  { userId: 'user-ava', roleType: 'TEAM_MANAGER', clubId: 'club-glen', associationId: null, teamId: GLEN_TEAM, revokedAt: null, player: { firstName: 'Ava', lastName: 'Clark' } },
]
const waverley = { id: 'assoc-waverley', name: 'Waverley Tennis', phone: '03 9000 0000', email: 'info@waverleytennis.example' }
const clubs = {
  'club-glen': { id: 'club-glen', name: 'Glen Waverley Tennis Club', phone: '03 9336 5357', email: 'admin@glen.example', address: '20 Reserve Road', associationId: waverley.id, association: waverley },
}
// Ava and Ben play for Glen (Ben left the club); Cara's home club is Mount but she
// also plays for Glen; Margaret is Glen's club admin; Mount-only is never Glen's.
const person = (id, firstName, lastName, extra = {}) => ({
  id, firstName, lastName, dateOfBirth: new Date('1990-01-01'), isJunior: false, phone: null, status: 'ACTIVE', user: null, ...extra,
})
const people = [
  person(AVA, 'Ava', 'Clark', { phone: '0400 000 001', user: { email: 'ava@club.example', userRole: { roleType: 'TEAM_MANAGER', revokedAt: null } } }),
  person(BEN, 'Ben', 'Adams'),
  person(CARA, 'Cara', 'Brown'),
  person(MARGARET, 'Margaret', 'Hayes', { user: { email: 'admin.glen@admin.example', userRole: { roleType: 'CLUB_ADMIN', revokedAt: null } } }),
  person(MOUNT_ONLY, 'Mount', 'Only'),
]
const membership = (playerId, clubId, extra = {}) => ({ playerId, clubId, isPrimary: true, status: 'ACTIVE', startDate: new Date('2025-05-06'), endDate: null, ...extra })
const memberships = [
  membership(AVA, 'club-glen'),
  membership(BEN, 'club-glen', { status: 'INACTIVE', endDate: new Date('2026-03-01') }),
  membership(CARA, 'club-mount'),
  membership(CARA, 'club-glen', { isPrimary: false }),
  membership(MARGARET, 'club-glen'),
  membership(MOUNT_ONLY, 'club-mount'),
]
const clubNames = { 'club-glen': 'Glen Waverley Tennis Club', 'club-mount': 'Mount Waverley Tennis Club' }
const teamPlayers = [
  { teamId: GLEN_TEAM, playerId: AVA, status: 'ACTIVE', registerAt: new Date('2026-04-01T00:00:00Z') },
  { teamId: 'team-glen-1-old', playerId: AVA, status: 'ACTIVE', registerAt: null },
  { teamId: GLEN_TEAM, playerId: CARA, status: 'EMERGENCY', registerAt: null },
  { teamId: MOUNT_TEAM, playerId: CARA, status: 'ACTIVE', registerAt: null },
  { teamId: MOUNT_TEAM, playerId: MOUNT_ONLY, status: 'ACTIVE', registerAt: null },
]
const teamById = id => teams.find(t => t.id === id)
const personById = id => people.find(p => p.id === id)
// A player's roster places, filtered as the service's nested where asks.
const placesOf = (playerId, where = {}) => teamPlayers
  .filter(tp => tp.playerId === playerId && (where.status === undefined || tp.status === where.status)
    && (where.team?.clubId === undefined || teamById(tp.teamId).clubId === where.team.clubId))
  .map(tp => ({ ...tp, team: teamById(tp.teamId) }))
const withPlaces = (player, include) => ({ ...player, teamPlayers: placesOf(player.id, include.player?.include?.teamPlayers?.where ?? include.teamPlayers?.where) })

const unique = rows => [...new Map(rows.map(row => [row.id, row])).values()]
// Each fake reads the club ID from where the service's filter puts it, so a
// query that dropped the club filter would return every club's rows.
const prisma = {
  user: { findUnique: async ({ where }) => users[where.email] ?? null },
  userRole: {
    // Matches the guard's query (userId + clubId not null) and the contact lookups (associationId).
    findFirst: async ({ where }) => {
      const role = roles.find(r => r.roleType === where.roleType && r.revokedAt === null
        && (where.userId === undefined || r.userId === where.userId)
        && (where.clubId === undefined || r.clubId !== null)
        && (where.associationId === undefined || r.associationId === where.associationId)
        && (where.teamId === undefined || r.teamId === where.teamId))
      return role ? { ...role, user: { profile: role.player ?? null } } : null
    },
  },
  club: { findUnique: async ({ where }) => clubs[where.id] ?? null },
  competition: {
    findMany: async ({ where }) => {
      const clubId = where?.seasons?.some?.sections?.some?.teams?.some?.clubId
      return unique(teams.filter(t => t.clubId === clubId).map(t => t.section.season.competition))
    },
  },
  sectionGrade: { findMany: async ({ where }) => unique(teams.filter(t => t.clubId === where?.teams?.some?.clubId).map(t => t.section)) },
  team: {
    findMany: async ({ where }) => teams.filter(t => t.clubId === where?.clubId),
    findFirst: async ({ where }) => {
      const found = teams.find(t => t.id === where.id && t.clubId === where.clubId)
      return found ? { ...found, teamPlayers: teamPlayers.filter(tp => tp.teamId === found.id).map(tp => ({ ...tp, player: personById(tp.playerId) })) } : null
    },
  },
  clubMembership: {
    findMany: async ({ where, include }) => memberships.filter(m => m.clubId === where.clubId)
      .map(m => ({ ...m, player: withPlaces(personById(m.playerId), include) })),
  },
  player: {
    findFirst: async ({ where, include }) => {
      const clubId = where.clubMemberships.some.clubId
      if (!memberships.some(m => m.playerId === where.id && m.clubId === clubId)) return null
      const found = personById(where.id)
      return {
        ...found,
        clubMemberships: memberships.filter(m => m.playerId === found.id).map(m => ({ ...m, club: { name: clubNames[m.clubId] } })),
        teamPlayers: placesOf(found.id, include.teamPlayers.where),
      }
    },
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
  assert.deepEqual(body.data.map(t => t.id), [GLEN_TEAM, 'team-glen-1-old'])
  assert.deepEqual(
    { name: body.data[0].name, sectionName: body.data[0].sectionName, seasonLabel: body.data[0].seasonLabel },
    { name: 'Glen Waverley 1', sectionName: 'Section 1', seasonLabel: 'Winter 2026' },
  )
})

test('I-CLUBADMIN-009: support contacts are the admin\'s own club and its association, with current role holders named', async () => {
  const { status, body } = await get('support-contacts', ADMIN)
  assert.equal(status, 200)
  assert.deepEqual(body.data, {
    club: { clubName: 'Glen Waverley Tennis Club', phone: '03 9336 5357', email: 'admin@glen.example', address: '20 Reserve Road' },
    association: {
      name: 'Waverley Tennis', administratorName: 'Raj Mitchell', recordsSecretaryName: 'Mia Coleman',
      phone: '03 9000 0000', email: 'info@waverleytennis.example',
    },
  })
})

test('I-CLUBADMIN-010: a role nobody holds is null, not another association\'s volunteer', async () => {
  const original = roles.splice(roles.findIndex(r => r.userId === 'user-raj'), 1)
  try {
    const { body } = await get('support-contacts', ADMIN)
    assert.equal(body.data.association.administratorName, null)
    assert.equal(body.data.association.recordsSecretaryName, 'Mia Coleman')
  } finally {
    roles.push(...original)
  }
})

test('I-CLUBADMIN-011: players are the club\'s members, active or not, without the club admin and without contact details', async () => {
  const { status, body } = await get('players', ADMIN)
  assert.equal(status, 200)
  assert.deepEqual(body.data, [
    { id: AVA, firstName: 'Ava', lastName: 'Clark', membership: { status: 'ACTIVE', isPrimary: true, startDate: '2025-05-06', endDate: null }, teamNames: ['Glen Waverley 1'] },
    { id: BEN, firstName: 'Ben', lastName: 'Adams', membership: { status: 'INACTIVE', isPrimary: true, startDate: '2025-05-06', endDate: '2026-03-01' }, teamNames: [] },
    { id: CARA, firstName: 'Cara', lastName: 'Brown', membership: { status: 'ACTIVE', isPrimary: false, startDate: '2025-05-06', endDate: null }, teamNames: [] },
  ])
})

test('I-CLUBADMIN-012: a player\'s detail lists every membership, primary first, but only this club\'s teams', async () => {
  const { status, body } = await get(`players/${CARA}`, ADMIN)
  assert.equal(status, 200)
  assert.deepEqual(body.data.memberships.map(m => [m.clubName, m.isPrimary]), [['Mount Waverley Tennis Club', true], ['Glen Waverley Tennis Club', false]])
  assert.deepEqual(body.data.teams.map(t => [t.teamName, t.status, t.seasonLabel]), [['Glen Waverley 1', 'EMERGENCY', 'Winter 2026']])
  const ava = (await get(`players/${AVA}`, ADMIN)).body.data
  assert.deepEqual({ email: ava.email, phone: ava.phone, dateOfBirth: ava.dateOfBirth }, { email: 'ava@club.example', phone: '0400 000 001', dateOfBirth: '1990-01-01' })
})

test('I-CLUBADMIN-013: another club\'s player or the admin\'s own profile is a 404, a malformed ID a 400', async () => {
  for (const id of [MOUNT_ONLY, MARGARET]) {
    const { status, body } = await get(`players/${id}`, ADMIN)
    assert.equal(status, 404, id)
    assert.equal(body.code, 'PLAYER_NOT_FOUND', id)
  }
  assert.equal((await get('players/not-a-uuid', ADMIN)).status, 400)
})

test('I-CLUBADMIN-014: a team\'s detail has its roster by name and its manager; another club\'s team is a 404', async () => {
  const { status, body } = await get(`teams/${GLEN_TEAM}`, ADMIN)
  assert.equal(status, 200)
  assert.equal(body.data.managerName, 'Ava Clark')
  assert.equal(body.data.seasonLabel, 'Winter 2026')
  assert.deepEqual(body.data.players, [
    { id: AVA, firstName: 'Ava', lastName: 'Clark', status: 'ACTIVE', registeredAt: '2026-04-01T00:00:00.000Z' },
    { id: CARA, firstName: 'Cara', lastName: 'Brown', status: 'EMERGENCY', registeredAt: null },
  ])
  const other = await get(`teams/${MOUNT_TEAM}`, ADMIN)
  assert.equal(other.status, 404)
  assert.equal(other.body.code, 'TEAM_NOT_FOUND')
})

test('I-CLUBADMIN-004: the email is normalised before lookup', async () => {
  assert.equal((await get('teams', '  Admin.Glen@Admin.EXAMPLE ')).status, 200)
})

test('I-CLUBADMIN-005: a player or a revoked admin is refused with 403', async () => {
  for (const email of ['chloe@club.example', 'revoked@admin.example']) {
    for (const path of ['teams', `teams/${GLEN_TEAM}`, 'players', `players/${AVA}`, 'support-contacts']) {
      const { status, body } = await get(path, email)
      assert.equal(status, 403, `${email} ${path}`)
      assert.equal(body.code, 'NOT_CLUB_ADMIN', `${email} ${path}`)
    }
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
