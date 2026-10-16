const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { ClubAdminModule } = require('../dist/club-admin/club-admin.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')

const users = [
  { id: 'user-admin', email: 'admin.glen@admin.example', profile: { firstName: 'Margaret' } },
  { id: 'user-noprofile', email: 'admin.mount@admin.example', profile: null },
  { id: 'user-chloe', email: 'chloe@club.example', profile: null },
]
const role = (userId, roleType, extra = {}) => ({ id: `role-${userId}`, userId, roleType, clubId: null, teamId: null, revokedAt: null, grantedAt: new Date('2026-01-01'), ...extra })
const roles = [
  role('user-admin', 'CLUB_ADMIN', { clubId: 'club-glen' }),
  role('user-noprofile', 'CLUB_ADMIN', { clubId: 'club-mount' }),
  role('user-chloe', 'PLAYER'),
  role('user-diego', 'TEAM_MANAGER', { teamId: 'team-a-2026' }),
  // An older manager of the same team wins; the revoked one never counts.
  role('user-early', 'TEAM_MANAGER', { teamId: 'team-b-2026', grantedAt: new Date('2025-01-01') }),
  role('user-late', 'TEAM_MANAGER', { teamId: 'team-b-2026' }),
  role('user-gone', 'TEAM_MANAGER', { teamId: 'team-a-2025', revokedAt: new Date('2025-12-01') }),
]
const managerUsers = {
  'user-diego': { email: 'diego@club.example', profile: { firstName: 'Diego', lastName: 'Brooks' } },
  'user-early': { email: 'early@club.example', profile: null },
  'user-late': { email: 'late@club.example', profile: { firstName: 'Late', lastName: 'Comer' } },
  'user-gone': { email: 'gone@club.example', profile: { firstName: 'Gone', lastName: 'Away' } },
}
const clubs = {
  'club-glen': { id: 'club-glen', name: 'Glen Waverley Tennis Club', phone: '03 9336 5357', email: 'admin@glen.example', address: '20 Reserve Road', association: { name: 'Waverley Tennis' } },
  'club-mount': { id: 'club-mount', name: 'Mount Waverley Tennis Club', phone: null, email: null, address: null, association: { name: 'Waverley Tennis' } },
}

const season = (seasonId, seasonType, year, startDate, status, competition = 'Weekend Senior') => ({
  id: seasonId, seasonType, year, startDate: startDate && new Date(startDate), endDate: null, status, competition: { name: competition },
})
const winter25 = season('season-w25', 'Winter', 2025, '2025-04-01', 'COMPLETED')
const winter26 = season('season-w26', 'Winter', 2026, '2026-04-01', 'ACTIVE')
const night26 = season('season-n26', 'Autumn', 2026, '2026-02-01', 'COMPLETED', 'Night Tennis')
const undated = season('season-tbc', 'Summer', null, null, 'UPCOMING')
const team = (teamId, name, clubId, seasonRow, sectionName, activeSquad) => ({
  id: teamId, name, clubId, section: { name: sectionName, season: seasonRow }, _count: { teamPlayers: activeSquad },
})
const teams = [
  team('team-a-2025', 'Glen Waverley A', 'club-glen', winter25, 'Section 1', 6),
  team('team-a-2026', 'Glen Waverley A', 'club-glen', winter26, 'Section 1', 6),
  team('team-b-2026', 'Glen Waverley B', 'club-glen', winter26, 'Section 2', 0),
  team('team-n-2026', 'Glen Waverley A', 'club-glen', night26, 'Section 1', 4),
  team('team-new', 'Glen Waverley C', 'club-glen', undated, 'Section 3', 0),
  team('team-mount', 'Mount Waverley A', 'club-mount', winter26, 'Section 1', 6),
]

// Ava and Ben count; Cara left, Dan starts next year, Ed's membership is inactive,
// and the club admin's own profile is not a member. Fay has two rows but counts once.
const membership = (playerId, extra = {}) => ({ playerId, clubId: 'club-glen', status: 'ACTIVE', startDate: new Date('2025-01-01'), endDate: null, player: { user: null }, ...extra })
const memberships = [
  membership('ava'),
  membership('ben', { startDate: null }),
  membership('cara', { endDate: new Date('2026-01-31') }),
  membership('dan', { startDate: new Date('2099-01-01') }),
  membership('ed', { status: 'INACTIVE' }),
  membership('margaret', { player: { user: { userRole: { roleType: 'CLUB_ADMIN', revokedAt: null } } } }),
  membership('fay'),
  membership('fay'),
]

const fixture = (roundNumber, home, away, roundLabel = null) => ({ roundNumber, roundLabel, homeTeam: { name: home }, awayTeam: { name: away } })
const results = [
  { id: 'result-r12', corrections: [], fixture: fixture(12, 'Forest Hill B', 'Glen Waverley B') },
  { id: 'result-r11', corrections: [{ id: 'correction-r11' }], fixture: fixture(11, 'Glen Waverley B', 'Chadstone B') },
  { id: 'result-gf', corrections: [], fixture: fixture(null, 'Glen Waverley A', 'Syndal A', 'Grand Final') },
]
const event = (eventId, entityType, entityId, changedAt, changeSummary, action = 'RESULT_FINALISED') => ({
  id: eventId, entityType, entityId, action, changeSummary, changedAt: new Date(changedAt),
})
const events = [
  event('aud-1', 'MatchResult', 'result-r11', '2026-09-13T00:00:00Z', 'Result confirmed by the away team: 2-1 in rubbers.'),
  event('aud-2', 'MatchResult', 'result-r11', '2026-09-13T23:15:00Z', 'Away team disputed the second singles rubber score.', 'CORRECTION_REQUESTED'),
  event('aud-3', 'CorrectionRequest', 'correction-r11', '2026-09-15T02:00:00Z', null, 'CORRECTION_APPROVED'),
  event('aud-4', 'MatchResult', 'result-r12', '2026-09-20T00:00:00Z', 'Result confirmed by the away team: 2-1 in rubbers.'),
  event('aud-5', 'MatchResult', 'result-gf', '2026-10-01T00:00:00Z', 'Grand final result entered.'),
  event('aud-6', 'MatchResult', 'result-gf', '2026-10-02T00:00:00Z', 'Grand final result confirmed.'),
  event('aud-7', 'MatchResult', 'result-other-club', '2026-10-05T00:00:00Z', 'Another club\'s result.'),
  event('aud-8', 'TEAM', 'team-a-2026', '2026-10-06T00:00:00Z', 'Added Ava Clark', 'ADD_PLAYERS'),
]
const unread = { 'user-admin': 3, 'user-noprofile': 0 }

let auditQuery
const prisma = {
  user: {
    findUnique: async ({ where }) => users.find(u => u.email === where.email) ?? null,
    findUniqueOrThrow: async ({ where }) => {
      const found = users.find(u => u.id === where.id)
      if (!found) throw new Error('No User found')
      return found
    },
  },
  userRole: {
    findFirst: async ({ where }) => roles.find(r => r.userId === where.userId && r.roleType === where.roleType && r.revokedAt === null && r.clubId !== null) ?? null,
    findMany: async ({ where }) => roles
      .filter(r => r.roleType === where.roleType && r.revokedAt === null && where.teamId.in.includes(r.teamId))
      .sort((a, b) => a.grantedAt - b.grantedAt || a.id.localeCompare(b.id))
      .map(r => ({ ...r, user: managerUsers[r.userId] })),
  },
  club: { findUniqueOrThrow: async ({ where }) => clubs[where.id] },
  clubMembership: { findMany: async ({ where }) => memberships.filter(m => m.clubId === where.clubId) },
  team: { findMany: async ({ where }) => teams.filter(t => t.clubId === where.clubId) },
  notification: {
    count: async ({ where }) => {
      assert.deepEqual([where.channel, where.readAt], ['IN_APP', null])
      return unread[where.userId]
    },
  },
  // Only Glen plays in these results; Mount has none.
  matchResult: {
    findMany: async ({ where }) => (where.fixture.OR.every(side => Object.values(side)[0].clubId === 'club-glen') ? results : []),
  },
  auditLog: {
    findMany: async args => {
      auditQuery = args
      const [results, corrections] = args.where.OR
      return events
        .filter(e => (e.entityType === results.entityType && results.entityId.in.includes(e.entityId))
          || (e.entityType === corrections.entityType && corrections.entityId.in.includes(e.entityId)))
        .sort((a, b) => b.changedAt - a.changedAt)
        .slice(0, args.take)
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

async function get(email = 'admin.glen@admin.example') {
  const response = await fetch(`${url}/api/v1/club-admin/dashboard?email=${encodeURIComponent(email)}`)
  return { status: response.status, body: await response.json() }
}

test('I-CLUBDASH-001: the dashboard names the club and greets the admin by first name', async () => {
  const { status, body } = await get()
  assert.equal(status, 200)
  assert.match(body.data.asOf, /^\d{4}-\d{2}-\d{2}$/)
  assert.deepEqual(body.data.club, {
    id: 'club-glen', name: 'Glen Waverley Tennis Club', associationName: 'Waverley Tennis',
    phone: '03 9336 5357', email: 'admin@glen.example', address: '20 Reserve Road',
  })
  assert.equal(body.data.adminName, 'Margaret')
  assert.equal(body.data.unreadCount, 3)
})

test('I-CLUBDASH-002: active members are distinct players with a current membership, not the club admin', async () => {
  assert.equal((await get()).body.data.activeMembers, 3) // Ava, Ben and Fay
})

test('I-CLUBDASH-003: seasons are those the club has a team in, oldest first, undated last', async () => {
  const { body } = await get()
  assert.deepEqual(body.data.seasons, [
    { id: 'season-w25', label: 'Winter 2025', competition: 'Weekend Senior', status: 'COMPLETED' },
    { id: 'season-n26', label: 'Autumn 2026', competition: 'Night Tennis', status: 'COMPLETED' },
    { id: 'season-w26', label: 'Winter 2026', competition: 'Weekend Senior', status: 'ACTIVE' },
    { id: 'season-tbc', label: 'Summer', competition: 'Weekend Senior', status: 'UPCOMING' },
  ])
})

test('I-CLUBDASH-004: each team has its season, active squad size and current manager', async () => {
  const { body } = await get()
  assert.deepEqual(body.data.teams, [
    { id: 'team-a-2025', name: 'Glen Waverley A', seasonId: 'season-w25', competition: 'Weekend Senior', section: 'Section 1', squadCount: 6, managerName: null },
    { id: 'team-a-2026', name: 'Glen Waverley A', seasonId: 'season-w26', competition: 'Weekend Senior', section: 'Section 1', squadCount: 6, managerName: 'Diego Brooks' },
    // The longest-serving manager, by email as they have no profile.
    { id: 'team-b-2026', name: 'Glen Waverley B', seasonId: 'season-w26', competition: 'Weekend Senior', section: 'Section 2', squadCount: 0, managerName: 'early@club.example' },
    { id: 'team-n-2026', name: 'Glen Waverley A', seasonId: 'season-n26', competition: 'Night Tennis', section: 'Section 1', squadCount: 4, managerName: null },
    { id: 'team-new', name: 'Glen Waverley C', seasonId: 'season-tbc', competition: 'Weekend Senior', section: 'Section 3', squadCount: 0, managerName: null },
  ])
})

test('I-CLUBDASH-005: recent activity is the newest result events for the club\'s fixtures, corrections included', async () => {
  const { body } = await get()
  assert.deepEqual(body.data.activity, [
    { id: 'aud-6', summary: 'Grand final result confirmed.', match: 'Grand Final · Glen Waverley A vs Syndal A', date: '2026-10-02T00:00:00.000Z' },
    { id: 'aud-5', summary: 'Grand final result entered.', match: 'Grand Final · Glen Waverley A vs Syndal A', date: '2026-10-01T00:00:00.000Z' },
    { id: 'aud-4', summary: 'Result confirmed by the away team: 2-1 in rubbers.', match: 'Round 12 · Forest Hill B vs Glen Waverley B', date: '2026-09-20T00:00:00.000Z' },
    // A correction review is logged against the request and traced to its result; with no summary, the action stands in.
    { id: 'aud-3', summary: 'CORRECTION_APPROVED', match: 'Round 11 · Glen Waverley B vs Chadstone B', date: '2026-09-15T02:00:00.000Z' },
    { id: 'aud-2', summary: 'Away team disputed the second singles rubber score.', match: 'Round 11 · Glen Waverley B vs Chadstone B', date: '2026-09-13T23:15:00.000Z' },
  ])
  assert.equal(auditQuery.take, 5)
})

test('I-CLUBDASH-006: an admin without a profile is greeted by email; a club with no results has no activity', async () => {
  auditQuery = undefined
  const { status, body } = await get('admin.mount@admin.example')
  assert.equal(status, 200)
  assert.equal(body.data.adminName, 'admin.mount@admin.example')
  assert.deepEqual(body.data.activity, [])
  assert.equal(auditQuery, undefined, 'the audit log is not searched when there are no results')
  assert.deepEqual(body.data.teams.map(t => t.id), ['team-mount'])
})

test('I-CLUBDASH-007: a player gets 403 and a database failure is a 503 that leaks nothing', async () => {
  const refused = await get('chloe@club.example')
  assert.equal(refused.status, 403)
  assert.equal(refused.body.code, 'NOT_CLUB_ADMIN')
  const original = prisma.team.findMany
  prisma.team.findMany = async () => { throw new Error('password=secret host=db.internal') }
  try {
    const { status, body } = await get()
    assert.equal(status, 503)
    assert.equal(body.code, 'DATA_UNAVAILABLE')
    assert.ok(!JSON.stringify(body).includes('secret'))
  } finally {
    prisma.team.findMany = original
  }
})
