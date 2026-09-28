const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { DashboardModule } = require('../dist/dashboard/dashboard.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { parseQuery, ageOn, paginate } = require('../dist/dashboard/dashboard.query')

// In-memory query fixtures only: never insert test records into the user's database.
const competition = { id: '11111111-1111-4111-8111-111111111111', name: 'Test competition' }
const section = { season: { competition } }
const alice = { id: 'alice', firstName: 'Alice', lastName: 'One' }
const bob = { id: 'bob', firstName: 'Bob', lastName: 'Two' }
function player(person, teamId) {
  return {
    ...person, userId: `${person.id}-login`, status: 'ACTIVE', dateOfBirth: new Date('2000-03-01'), gender: 'OTHER', email: null, phone: null,
    clubMemberships: [{ isPrimary: true, club: { id: `${teamId}-club`, name: `${person.firstName} club` } }],
    associationMemberships: [], teamPlayers: [{ teamId, team: { id: teamId, name: `${person.firstName} team` } }],
    utrLink: { status: 'ACTIVE', utrRating: '7.85', lastSyncedAt: null },
  }
}
const users = {
  'alice@example.test': { email: 'alice@example.test', player: player(alice, 'team-a') },
  'bob@example.test': { email: 'bob@example.test', player: player(bob, 'team-b') },
  'unlinked@example.test': { email: 'unlinked@example.test', player: null },
}
function fixture(id, team, date, status = 'SCHEDULED') {
  return { id, homeTeamId: team, awayTeamId: 'visitors', homeTeam: { id: team, name: team }, awayTeam: { id: 'visitors', name: 'Visitors' },
    scheduleDate: date ? new Date(date) : null, scheduleTime: null, roundNumber: 0, status, section }
}
const fixtures = [
  fixture('a-1', 'team-a', '2099-01-01'), fixture('a-2', 'team-a', '2099-01-02'),
  fixture('a-3', 'team-a', '2099-01-03'), fixture('a-4', 'team-a', '2099-01-04'),
  fixture('a-undated', 'team-a', null), fixture('cancelled', 'team-a', '2099-01-05', 'CANCELLED'),
  fixture('old', 'team-a', '2020-01-01', 'COMPLETED'), fixture('b-1', 'team-b', '2099-02-01'),
]
const match = {
  id: 'rubber-one', rubberType: 'SINGLES', matchResult: { status: 'FINALISED', fixture: fixtures[6] },
  rubberPlayers: [{ playerId: 'alice', side: 'HOME', player: alice }, { playerId: 'bob', side: 'AWAY', player: bob }],
  rubberSets: [{ setNumber: 1, homeGames: 6, awayGames: 3 }, { setNumber: 2, homeGames: 6, awayGames: 4 }],
}
// Already sorted newest first, as the service's orderBy returns them.
const notifications = [
  { id: 'n-new', userId: 'alice-login', type: 'MATCH_DATE_CHANGED', title: 'Match Date Changed', message: 'Moved', createdAt: new Date('2099-01-01T02:00:00Z'), readAt: null, details: { newDate: '2099-01-02' }, targetType: 'FIXTURE', targetId: 'a-1' },
  { id: 'n-old', userId: 'alice-login', type: 'MATCH_REMINDER', title: 'Match Reminder', message: 'Soon', createdAt: new Date('2099-01-01T01:00:00Z'), readAt: new Date('2099-01-01T03:00:00Z'), details: null, targetType: null, targetId: null },
]
let app, url, databaseDown = false
const calls = []
const prisma = {
  user: { findUnique: async args => { calls.push(args); if (databaseDown) throw new Error('private connection details'); return users[args.where.email] ?? null } },
  fixture: { findMany: async args => fixtures.filter(f => args.where.OR[0].homeTeamId.in.includes(f.homeTeamId) || args.where.OR[1].awayTeamId.in.includes(f.awayTeamId)) },
  playerAward: { count: async args => args.where.playerId === 'alice' ? 1 : 0 },
  notification: {
    findMany: async args => { assert.equal(args.where.channel, 'IN_APP'); return notifications.filter(n => n.userId === args.where.userId) },
    count: async args => notifications.filter(n => n.userId === args.where.userId && n.readAt === null).length,
  },
  rubber: { findMany: async args => {
    assert.equal(args.where.matchResult.status, 'FINALISED')
    return match.rubberPlayers.some(p => p.playerId === args.where.rubberPlayers.some.playerId) ? [match] : []
  } },
}
before(async () => {
  const module = await Test.createTestingModule({ imports: [DashboardModule] }).overrideProvider(PrismaService).useValue(prisma).compile()
  app = module.createNestApplication({ logger: false })
  await app.listen(0, '127.0.0.1')
  url = await app.getUrl()
})
after(async () => { await app?.close() })
async function get(path = '', query = {}) {
  const response = await fetch(`${url}/api/v1/player-dashboard${path}?${new URLSearchParams({ email: 'alice@example.test', ...query })}`)
  return { status: response.status, body: await response.json() }
}

test('I-DASH-001: HTTP dashboard resolves normalized email and selects only necessary account fields', async () => {
  const { status, body } = await get('', { email: '  ALICE@EXAMPLE.TEST ' })
  assert.equal(status, 200)
  assert.equal(body.data.profile.displayName, 'Alice One')
  assert.equal(body.data.profile.email, 'alice@example.test')
  assert.equal(body.data.profile.primaryClub.name, 'Alice club')
  assert.equal(body.data.utr.rating, 7.85)
  assert.equal(body.data.utr.discipline, null)
  assert.deepEqual(Object.keys(calls.at(-1).select).sort(), ['email', 'player'])
  assert.equal(body.data.upcomingMatches.items.length, 3)
  assert.equal(body.data.careerSummary.matchesPlayed, 1)
  assert.equal(body.data.careerSummary.matchesWon, 1)
  assert.equal(body.data.careerSummary.winPercentage, 100)
  assert.equal(body.data.careerSummary.titlesWon, 1)
  assert.deepEqual(body.data.profile.clubs.map(c => c.name), ['Alice club'])
})

test('I-DASH-002: another email selects a different profile, teams and fixtures', async () => {
  const { body } = await get('', { email: 'bob@example.test' })
  assert.equal(body.data.profile.id, 'bob')
  assert.equal(body.data.profile.primaryClub.name, 'Bob club')
  assert.deepEqual(body.data.upcomingMatches.items.map(i => i.id), ['b-1'])
})

test('I-DASH-003: missing account/profile are distinct useful 404s', async () => {
  for (const [email, code] of [['unknown@example.test', 'USER_NOT_FOUND'], ['unlinked@example.test', 'PLAYER_PROFILE_NOT_LINKED']]) {
    const result = await get('', { email })
    assert.equal(result.status, 404)
    assert.equal(result.body.code, code)
  }
})

test('I-DASH-004: result scores and outcomes are from the selected participant side', async () => {
  const a = await get('/results'), b = await get('/results', { email: 'bob@example.test' })
  assert.equal(a.body.data.items[0].score, '6-3 6-4')
  assert.equal(b.body.data.items[0].score, '3-6 4-6')
  assert.equal(b.body.data.items[0].opponents[0].name, 'Alice One')
  // No winnerSide is recorded for a completed rubber, so its sets decide it.
  assert.equal(a.body.data.items[0].outcome, 'WIN')
  assert.equal(b.body.data.items[0].outcome, 'LOSS')
})

test('I-DASH-005: preview cursor continues full schedule without repeats and cannot change account/filter', async () => {
  const first = (await get()).body.data.upcomingMatches
  assert.equal(first.hasMore, true)
  const next = await get('/schedule', { cursor: first.nextCursor })
  assert.deepEqual(next.body.data.items.map(i => i.id), ['a-4', 'a-undated'])
  assert.equal(next.body.data.hasMore, false)
  assert.equal((await get('/schedule', { cursor: first.nextCursor, email: 'bob@example.test' })).status, 400)
  assert.equal((await get('/schedule', { cursor: first.nextCursor, scope: 'all' })).status, 400)
})

test('I-DASH-006: full schedule includes old/cancelled items; inclusive ranges exclude undated items', async () => {
  assert.equal((await get('/schedule', { scope: 'all' })).body.data.items.length, 7)
  const filtered = await get('/schedule', { from: '2099-01-02', to: '2099-01-03' })
  assert.deepEqual(filtered.body.data.items.map(i => i.id), ['a-2', 'a-3'])
})

test('I-DASH-007: notifications are the login\'s own, newest first, with a separate unread count', async () => {
  const list = (await get('/notifications')).body.data
  assert.deepEqual(list.items.map(n => n.id), ['n-new', 'n-old'])
  assert.equal(list.unreadCount, 1)
  assert.deepEqual(list.items[0].details, { newDate: '2099-01-02' })
  assert.deepEqual(list.items[0].target, { type: 'FIXTURE', id: 'a-1' })
  assert.equal(list.items[1].target, null)
  assert.equal((await get('/notifications', { email: 'bob@example.test' })).body.data.items.length, 0)
  assert.equal((await get('/notifications', { email: 'unlinked@example.test' })).status, 404)
  const dashboard = (await get()).body.data.notifications
  assert.equal(dashboard.available, true)
  assert.equal(dashboard.unreadCount, 1)
})

test('I-DASH-008: bad queries and outages do not return false empty data or private errors', async () => {
  for (const query of [{ email: '' }, { limit: '0' }, { from: '2026-02-30' }, { cursor: 'bad' }, { scope: 'anything' }]) {
    assert.equal((await get('/schedule', query)).status, 400)
  }
  databaseDown = true
  try {
    const response = await get()
    assert.equal(response.status, 503)
    assert.equal(response.body.code, 'DATA_UNAVAILABLE')
    assert.equal(JSON.stringify(response.body).includes('private connection'), false)
  } finally { databaseDown = false }
})

test('I-DASH-009: email lookup is disabled when NODE_ENV=production', async () => {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try { assert.equal((await get()).status, 403) } finally {
    if (previous === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = previous
  }
})

test('DASH-001: age boundary and query types', () => {
  assert.equal(ageOn('2000-03-01', '2026-02-28'), 25)
  assert.equal(ageOn('2000-03-01', '2026-03-01'), 26)
  assert.throws(() => parseQuery({ email: ['alice@example.test', 'bob@example.test'] }))
  assert.throws(() => parseQuery({ email: 'alice@example.test', from: '2026-12-01', to: '2026-01-01' }))
  assert.deepEqual(paginate([], 20, ['empty']), { available: true, items: [], nextCursor: null, hasMore: false })
})
