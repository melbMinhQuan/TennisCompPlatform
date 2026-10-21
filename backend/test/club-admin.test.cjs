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
  { userId: 'user-ava', roleType: 'TEAM_MANAGER', clubId: 'club-glen', associationId: null, teamId: GLEN_TEAM, revokedAt: null, email: 'ava@club.example', player: { id: AVA, code: 'PLR001', firstName: 'Ava', lastName: 'Clark' } },
]
const waverley = { id: 'assoc-waverley', name: 'Waverley Tennis', phone: '03 9000 0000', email: 'info@waverleytennis.example' }
const clubs = {
  'club-glen': { id: 'club-glen', name: 'Glen Waverley Tennis Club', phone: '03 9336 5357', email: 'admin@glen.example', address: '20 Reserve Road', associationId: waverley.id, association: waverley },
}
// Ava and Ben play for Glen (Ben left the club); Cara's home club is Mount but she
// also plays for Glen; Margaret is Glen's club admin; Mount-only is never Glen's.
const person = (id, firstName, lastName, extra = {}) => ({
  id, code: null, firstName, lastName, dateOfBirth: new Date('1990-01-01'), isJunior: false, phone: null, status: 'ACTIVE', user: null, ...extra,
})
const people = [
  person(AVA, 'Ava', 'Clark', { code: 'PLR001', phone: '0400 000 001', user: { email: 'ava@club.example', userRole: { roleType: 'TEAM_MANAGER', revokedAt: null, teamId: GLEN_TEAM } } }),
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
      return role ? { ...role, user: { email: role.email ?? null, profile: role.player ?? null } } : null
    },
    // The current managers of a set of teams (teamManagerNames).
    findMany: async ({ where }) => roles
      .filter(r => r.roleType === where.roleType && r.revokedAt === null && where.teamId.in.includes(r.teamId))
      .map(r => ({ ...r, user: { email: r.email ?? null, profile: r.player ?? null } })),
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
    findMany: async ({ where }) => {
      // The Players list asks which managers' teams are still to finish their season.
      if (where.id?.in) {
        return teams.filter(t => where.id.in.includes(t.id) && !where.section.season.status.notIn.includes(t.section.season.status))
      }
      return teams.filter(t => t.clubId === where.clubId)
        .map(t => ({ ...t, _count: { teamPlayers: teamPlayers.filter(tp => tp.teamId === t.id && tp.status === 'ACTIVE').length } }))
    },
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
  const noLogin = { hasLogin: false, role: null, managedTeam: null }
  assert.deepEqual(body.data, [
    {
      id: AVA, code: 'PLR001', firstName: 'Ava', lastName: 'Clark', isJunior: false, status: 'ACTIVE', membership: { status: 'ACTIVE', isPrimary: true, startDate: '2025-05-06', endDate: null },
      teamNames: ['Glen Waverley 1'], hasLogin: true, role: 'TEAM_MANAGER', managedTeam: { id: GLEN_TEAM, name: 'Glen Waverley 1' },
    },
    { id: BEN, code: null, firstName: 'Ben', lastName: 'Adams', isJunior: false, status: 'ACTIVE', membership: { status: 'INACTIVE', isPrimary: true, startDate: '2025-05-06', endDate: '2026-03-01' }, teamNames: [], ...noLogin },
    { id: CARA, code: null, firstName: 'Cara', lastName: 'Brown', isJunior: false, status: 'ACTIVE', membership: { status: 'ACTIVE', isPrimary: false, startDate: '2025-05-06', endDate: null }, teamNames: [], ...noLogin },
  ])
})

test('I-CLUBADMIN-015: each player says whether they can manage a team: login, role, and a team still playing', async () => {
  const [ben, cara] = [personById(BEN), personById(CARA)]
  const saved = [ben.user, cara.user, ben.status]
  // Ben managed last season's team, which no longer ties him down; Cara is the association's
  // administrator; a revoked role counts as none.
  ben.user = { email: 'ben@club.example', userRole: { roleType: 'TEAM_MANAGER', revokedAt: null, teamId: 'team-glen-1-old' } }
  ben.status = 'SUSPENDED'
  cara.user = { email: 'cara@club.example', userRole: { roleType: 'ADMINISTRATOR', revokedAt: null, teamId: null } }
  try {
    const rows = Object.fromEntries((await get('players', ADMIN)).body.data.map(p => [p.firstName, [p.status, p.hasLogin, p.role, p.managedTeam]]))
    assert.deepEqual(rows, {
      Ava: ['ACTIVE', true, 'TEAM_MANAGER', { id: GLEN_TEAM, name: 'Glen Waverley 1' }],
      Ben: ['SUSPENDED', true, 'TEAM_MANAGER', null],
      Cara: ['ACTIVE', true, 'ADMINISTRATOR', null],
    })
    cara.user.userRole.revokedAt = new Date()
    const revoked = (await get('players', ADMIN)).body.data.find(p => p.id === CARA)
    assert.deepEqual([revoked.hasLogin, revoked.role], [true, null])
  } finally {
    [ben.user, cara.user, ben.status] = saved
  }
})

test('I-CLUBADMIN-016: the teams list has each team\'s active squad size and current manager', async () => {
  const { body } = await get('teams', ADMIN)
  assert.deepEqual(body.data.map(t => [t.id, t.squadCount, t.managerName]), [[GLEN_TEAM, 1, 'Ava Clark'], ['team-glen-1-old', 1, null]])
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
  assert.deepEqual(body.data.manager, { playerId: AVA, playerCode: 'PLR001', name: 'Ava Clark', email: 'ava@club.example' })
  assert.equal(body.data.seasonLabel, 'Winter 2026')
  assert.deepEqual(body.data.players, [
    { id: AVA, code: 'PLR001', firstName: 'Ava', lastName: 'Clark', isJunior: false, status: 'ACTIVE', registeredAt: '2026-04-01T00:00:00.000Z' },
    { id: CARA, code: null, firstName: 'Cara', lastName: 'Brown', isJunior: false, status: 'EMERGENCY', registeredAt: null },
  ])
  const other = await get(`teams/${MOUNT_TEAM}`, ADMIN)
  assert.equal(other.status, 404)
  assert.equal(other.body.code, 'TEAM_NOT_FOUND')
})

test('I-CLUBADMIN-017: a manager with no profile is named by their email, with no Player ID', async () => {
  const ava = roles.find(r => r.userId === 'user-ava')
  const { player } = ava
  delete ava.player
  try {
    const { body } = await get(`teams/${GLEN_TEAM}`, ADMIN)
    assert.equal(body.data.managerName, null)
    assert.deepEqual(body.data.manager, { playerId: null, playerCode: null, name: 'ava@club.example', email: 'ava@club.example' })
  } finally {
    ava.player = player
  }
})

// ── Juniors (docs/junior-privacy.md). Cara plays for Glen and Mount; Mount-only is never Glen's.
const asJunior = (person, guardian = { guardianName: 'Pat Brown', guardianEmail: 'pat.brown@families.example', guardianPhone: '0413 200 700' }) => {
  const saved = { isJunior: person.isJunior, phone: person.phone, user: person.user }
  Object.assign(person, { isJunior: true, phone: '0414 300 800', user: { email: 'cara@juniors.example', userRole: null }, ...guardian })
  return () => { Object.assign(person, saved); for (const key of Object.keys(guardian)) delete person[key] }
}

test('JUNIOR-001: a club admin sees every detail of a junior in their own club, parent contact included', async () => {
  const restore = asJunior(personById(CARA))
  try {
    const { status, body } = await get(`players/${CARA}`, ADMIN)
    assert.equal(status, 200)
    assert.deepEqual(
      { isJunior: body.data.isJunior, dateOfBirth: body.data.dateOfBirth, email: body.data.email, phone: body.data.phone, guardian: body.data.guardian },
      {
        isJunior: true, dateOfBirth: '1990-01-01', email: 'cara@juniors.example', phone: '0414 300 800',
        guardian: { name: 'Pat Brown', email: 'pat.brown@families.example', phone: '0413 200 700' },
      },
    )
    // The Players list and the squad mark the junior, still without contact details.
    const row = (await get('players', ADMIN)).body.data.find(p => p.id === CARA)
    assert.equal(row.isJunior, true)
    assert.equal(JSON.stringify(row).includes('0414 300 800'), false)
    const squad = (await get(`teams/${GLEN_TEAM}`, ADMIN)).body.data.players
    assert.deepEqual(squad.map(p => [p.firstName, p.isJunior]), [['Ava', false], ['Cara', true]])
    // An adult has no parent contact.
    assert.equal((await get(`players/${AVA}`, ADMIN)).body.data.guardian, null)
  } finally {
    restore()
  }
})

test('JUNIOR-002: a junior who only plays for another club is a 404 to this club admin, never their details', async () => {
  const restore = asJunior(personById(MOUNT_ONLY))
  try {
    const { status, body } = await get(`players/${MOUNT_ONLY}`, ADMIN)
    assert.equal(status, 404)
    assert.equal(body.code, 'PLAYER_NOT_FOUND')
    assert.equal(JSON.stringify(body).includes('families.example'), false)
    // Nor are they on the club's Players list, or reachable through the other club's team.
    assert.equal((await get('players', ADMIN)).body.data.some(p => p.id === MOUNT_ONLY), false)
    assert.equal((await get(`teams/${MOUNT_TEAM}`, ADMIN)).status, 404)
  } finally {
    restore()
  }
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
