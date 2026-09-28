const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { PlayerModule } = require('../dist/player/player.module')
const { PlayerLookupService } = require('../dist/player/player-lookup.service')
const { MatchesService } = require('../dist/player/matches.service')
const { ResultsService } = require('../dist/player/results.service')
const { MembershipsService } = require('../dist/player/memberships.service')
const { StandingsService } = require('../dist/player/standings.service')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')
const { seasonLabel, formatLabel, fixtureStatusLabel, clockTime, localDate } = require('../dist/player/player-mappers')

// ── An in-memory world. Nothing here touches the developer's database.
const date = value => new Date(`${value}T00:00:00Z`)
const time = value => new Date(`1970-01-01T${value}:00Z`)
const association = { id: 'assoc-1', name: 'Waverley Tennis', phone: '03 9000 0000', email: 'info@assoc.example', associationId: undefined }
const glen = { id: 'club-glen', name: 'Glen Waverley TC', associationId: 'assoc-1', association, phone: '03 1111 1111', email: 'glen@club.example', address: '1 Glen Rd' }
const mount = { id: 'club-mount', name: 'Mount Waverley TC', associationId: 'assoc-1', association, phone: '03 2222 2222', email: 'mount@club.example', address: '2 Mount Rd' }
const competition = { id: 'comp-1', name: 'Weekend Senior', associationId: 'assoc-1', association }
const current = { id: 'season-2026', seasonType: 'Winter', year: 2026, status: 'ACTIVE', startDate: date('2026-04-01'), competitionId: 'comp-1', competition }
const past = { id: 'season-2025', seasonType: 'Winter', year: 2025, status: 'COMPLETED', startDate: date('2025-04-01'), competitionId: 'comp-1', competition }
const section = (id, season) => ({ id, name: 'Section 1', seasonId: season.id, season })
const team = (id, name, club, sec) => ({ id, name, clubId: club.id, club, sectionId: sec.id, section: sec })
const mountA = team('team-mount-a', 'Mount Waverley A', mount, section('sec-2026', current))
const glenA = team('team-glen-a', 'Glen Waverley A', glen, section('sec-2025', past))
const rivals = team('team-rivals', 'Pinewood A', mount, section('sec-2026', current))
const people = {
  chloe: { id: 'player-chloe', firstName: 'Chloe', lastName: 'Cooper' },
  mei: { id: 'player-mei', firstName: 'Mei', lastName: 'Tran' },
  yuki: { id: 'player-yuki', firstName: 'Yuki', lastName: 'Green' },
}
const users = {
  'chloe@club.example': { player: people.chloe },
  'nolink@club.example': { player: null },
}
const rosters = [
  { teamId: mountA.id, team: mountA, playerId: 'player-chloe', player: people.chloe, status: 'ACTIVE' },
  { teamId: glenA.id, team: glenA, playerId: 'player-chloe', player: people.chloe, status: 'ACTIVE' },
  { teamId: mountA.id, team: mountA, playerId: 'player-yuki', player: people.yuki, status: 'EMERGENCY' },
  { teamId: rivals.id, team: rivals, playerId: 'player-mei', player: people.mei, status: 'ACTIVE' },
]
const venue = { name: 'Mount Waverley Tennis Centre', address: '24 Park Road', timeZone: 'Australia/Melbourne' }
const fixture = (id, home, away, extra) => ({
  id, homeTeamId: home.id, awayTeamId: away.id, homeTeam: home, awayTeam: away, venue: null,
  roundNumber: 1, roundLabel: null, scheduleDate: null, scheduleTime: null, status: 'SCHEDULED', ...extra,
})
// Already in the order the service's orderBy returns them (date ascending, undated last).
const fixtures = [
  fixture('fx-old', glenA, rivals, { scheduleDate: date('2025-06-01'), status: 'COMPLETED' }),
  fixture('fx-overdue', mountA, rivals, { scheduleDate: date('2020-01-01'), roundNumber: 2 }),
  fixture('fx-next', rivals, mountA, { scheduleDate: date('2099-05-01'), scheduleTime: time('13:00'), venue, roundNumber: 3 }),
  fixture('fx-final', mountA, rivals, { scheduleDate: date('2099-09-01'), roundNumber: null, roundLabel: 'Grand Final' }),
]
const rubber = {
  id: 'rubber-1', winnerSide: null, rubberType: 'DOUBLES', playedAt: new Date('2026-05-02T03:00:00Z'),
  rubberSets: [{ homeGames: 6, awayGames: 7 }, { homeGames: 6, awayGames: 3 }, { homeGames: 6, awayGames: 1 }],
  rubberPlayers: [
    { playerId: 'player-yuki', side: 'HOME', player: people.yuki },
    { playerId: 'player-chloe', side: 'HOME', player: people.chloe },
    { playerId: 'player-mei', side: 'AWAY', player: people.mei },
  ],
  matchResult: { fixture: { ...fixtures[1], venue, section: mountA.section, homeTeam: mountA, awayTeam: rivals } },
}
const retired = {
  ...rubber, id: 'rubber-2', winnerSide: 'AWAY', rubberType: 'SINGLES', playedAt: new Date('2026-05-09T03:00:00Z'),
  rubberSets: [{ homeGames: 6, awayGames: 2 }, { homeGames: 1, awayGames: 0 }],
  rubberPlayers: [{ playerId: 'player-chloe', side: 'HOME', player: people.chloe }, { playerId: 'player-mei', side: 'AWAY', player: people.mei }],
}
const roles = [
  { roleType: 'TEAM_MANAGER', teamId: mountA.id, revokedAt: null, user: { player: people.yuki } },
  { roleType: 'CLUB_ADMIN', clubId: glen.id, revokedAt: null, user: { player: people.mei } },
  { roleType: 'RECORDS_SECRETARY', associationId: 'assoc-1', revokedAt: new Date(), user: { player: people.mei } },
]
let databaseDown = false
const guard = rows => { if (databaseDown) throw new Error('password=secret host=db.internal'); return rows }
const prisma = {
  user: { findUnique: async ({ where }) => guard(users[where.email] ?? null) },
  teamPlayer: { findMany: async ({ where }) => guard(rosters.filter(r => r.playerId === where.playerId && (!where.status || r.status === where.status))) },
  fixture: { findMany: async ({ where }) => guard(fixtures.filter(f => where.OR[0].homeTeamId.in.includes(f.homeTeamId) || where.OR[1].awayTeamId.in.includes(f.awayTeamId))) },
  rubber: {
    findFirst: async () => ({ matchFormat: { singlesCount: 2, doublesCount: 1 } }),
    findMany: async ({ where }) => guard([rubber, retired].filter(r => r.rubberPlayers.some(p => p.playerId === where.rubberPlayers.some.playerId))),
  },
  associationMembership: {
    findMany: async () => [{ id: 'am-1', associationId: 'assoc-1', association, isPrimary: true, status: 'ACTIVE' }],
    findFirst: async () => ({ associationId: 'assoc-1', association }),
  },
  clubMembership: {
    findMany: async () => [
      { id: 'cm-1', clubId: glen.id, club: glen, isPrimary: true, status: 'ACTIVE', startDate: date('2025-05-06'), endDate: null },
      { id: 'cm-2', clubId: mount.id, club: mount, isPrimary: false, status: 'INACTIVE', startDate: date('2024-01-01'), endDate: date('2025-01-01') },
    ],
    findFirst: async () => ({ clubId: glen.id, club: glen }),
  },
  team: {
    findFirst: async ({ where }) => {
      const found = [mountA, glenA, rivals].find(t => t.id === where.id)
      const onRoster = found && rosters.some(r => r.teamId === found.id && r.playerId === where.teamPlayers.some.playerId)
      return onRoster ? { ...found, teamPlayers: rosters.filter(r => r.teamId === found.id) } : null
    },
  },
  userRole: { findFirst: async ({ where }) => roles.find(r => r.roleType === where.roleType && r.revokedAt === null && Object.keys(where).every(k => ['roleType', 'revokedAt'].includes(k) || r[k] === where[k])) ?? null },
  sectionGrade: { findMany: async () => [mountA.section, glenA.section] },
  ladderEntry: { findMany: async () => [{ id: 'lad-1', sectionId: 'sec-2026', teamId: mountA.id, team: mountA, position: 1, played: 3, won: 2, lost: 1, drawn: 0, points: 12, rubbersFor: 6, rubbersAgainst: 3, setsFor: 13, setsAgainst: 8, gamesFor: 90, gamesAgainst: 70, calculatedAt: new Date('2026-05-10T03:00:00Z') }] },
  playerStanding: { findMany: async () => [{ id: 'ps-1', sectionId: 'sec-2026', playerId: 'player-chloe', player: people.chloe, position: 4, rubbersPlayed: 3, rubbersWon: 2, rubbersLost: 1, setsWon: 5, setsLost: 3, gamesWon: 40, gamesLost: 30, winPercentage: { toString: () => '66.67' }, calculatedAt: new Date('2026-05-10T03:00:00Z') }] },
  rankingCohort: { findMany: async () => [{ id: 'coh-1', name: 'Adult singles', description: null, associationId: 'assoc-1', discipline: 'SINGLES' }] },
  rankingEntry: { findMany: async () => [{ id: 'rank-1', cohortId: 'coh-1', playerId: 'player-chloe', player: people.chloe, rank: 12, rating: { toString: () => '5.35' }, percentileRank: { toString: () => '88.00' }, asOf: new Date('2026-05-01T00:00:00Z') }] },
  playerAward: { findMany: async () => [
    { awardType: 'SECTION_WINNER', teamId: glenA.id, team: { sectionId: 'sec-2025' } },
    { awardType: 'RUNNER_UP', teamId: 'team-other', team: { sectionId: 'sec-2025' } },
  ] },
}
const lookup = new PlayerLookupService(prisma)
const matches = new MatchesService(prisma, lookup)
const results = new ResultsService(prisma, lookup)
const memberships = new MembershipsService(prisma, lookup)
const standings = new StandingsService(prisma, lookup)
const EMAIL = 'chloe@club.example'

// ── Unit: helpers
test('MAP-001: season, format, status and time labels', () => {
  assert.equal(seasonLabel({ seasonType: 'Winter', year: 2026 }), 'Winter 2026')
  assert.equal(seasonLabel({ seasonType: null, year: null }), 'Season to be confirmed')
  assert.equal(formatLabel({ singlesCount: 2, doublesCount: 1 }), 'Team singles & doubles')
  assert.equal(formatLabel({ singlesCount: 0, doublesCount: 4 }), 'Team doubles')
  assert.equal(formatLabel(null), 'Format to be confirmed')
  assert.equal(fixtureStatusLabel('POSTPONED'), 'Postponed')
  assert.equal(clockTime(time('13:05')), '13:05')
  // 23:30 UTC on 1 May is already 2 May in Melbourne.
  assert.equal(localDate(new Date('2026-05-01T23:30:00Z'), 'Australia/Melbourne'), '2026-05-02')
})

// ── Unit: player lookup
test('PLAYER-001: an email resolves to its linked player', async () => {
  assert.deepEqual(await lookup.findByEmail(EMAIL), { id: 'player-chloe', displayName: 'Chloe Cooper' })
})

test('PLAYER-002: unknown and unlinked accounts are distinct 404s', async () => {
  await assert.rejects(lookup.findByEmail('ghost@club.example'), e => e.getStatus() === 404 && e.getResponse().code === 'USER_NOT_FOUND')
  await assert.rejects(lookup.findByEmail('nolink@club.example'), e => e.getStatus() === 404 && e.getResponse().code === 'PLAYER_PROFILE_NOT_LINKED')
})

// ── Unit: fixtures and competitions
test('FIX-001: fixtures cover all the player\'s active teams, seen from the player\'s side', async () => {
  const list = await matches.fixtures(EMAIL)
  assert.deepEqual(list.map(f => f.id), ['fx-old', 'fx-overdue', 'fx-next', 'fx-final'])
  const next = list.find(f => f.id === 'fx-next')
  assert.equal(next.side, 'Away')
  assert.equal(next.team, 'Mount Waverley A')
  assert.equal(next.club, 'Mount Waverley TC')
  assert.equal(next.time, '13:00')
  assert.equal(next.venue, 'Mount Waverley Tennis Centre')
  assert.equal(next.format, 'Team singles & doubles')
  assert.equal(list.find(f => f.id === 'fx-old').status, 'Completed')
})

test('FIX-002: a finals fixture has no round number but carries its label', async () => {
  const final = (await matches.fixtures(EMAIL)).find(f => f.id === 'fx-final')
  assert.equal(final.round, null)
  assert.equal(final.roundLabel, 'Grand Final')
})

test('COMP-001: one competition entry per active team, newest season first', async () => {
  const entries = await matches.competitions(EMAIL)
  assert.deepEqual(entries.map(e => [e.id, e.season, e.seasonStatus]), [['team-mount-a', 'Winter 2026', 'ACTIVE'], ['team-glen-a', 'Winter 2025', 'COMPLETED']])
  assert.deepEqual(entries[0].player, { id: 'player-chloe', name: 'Chloe Cooper' })
})

test('COMP-002: the next fixture skips past dates and finished seasons have none', async () => {
  const [currentEntry, pastEntry] = await matches.competitions(EMAIL)
  assert.equal(currentEntry.nextFixture.id, 'fx-next') // fx-overdue (2020) is still SCHEDULED but in the past
  assert.equal(currentEntry.nextFixture.timeZone, 'Australia/Melbourne')
  assert.equal(pastEntry.nextFixture, null)
})

// ── Unit: results
test('RES-001: a completed rubber is won by sets, and scores are from the player\'s side', async () => {
  const doubles = (await results.results(EMAIL)).find(r => r.id === 'rubber-1')
  assert.equal(doubles.result, 'W') // 6-7 6-3 6-1: two sets to one
  assert.deepEqual(doubles.players, ['Yuki Green', 'Chloe Cooper'])
  assert.deepEqual(doubles.opponents, ['Mei Tran'])
  assert.deepEqual(doubles.sets[0], { playerGames: 6, opponentGames: 7 })
  assert.equal(doubles.date, '2026-05-02')
  assert.equal(doubles.club, 'Mount Waverley TC')
})

test('RES-002: results are newest first', async () => {
  assert.deepEqual((await results.results(EMAIL)).map(r => r.id), ['rubber-2', 'rubber-1'])
})

// ── Unit: memberships, roster and contacts
test('MEM-001: memberships list associations, clubs (with dates) and active teams', async () => {
  const data = await memberships.memberships(EMAIL)
  assert.equal(data.player.displayName, 'Chloe Cooper')
  assert.deepEqual(data.associations.map(a => [a.name, a.isPrimary, a.startDate]), [['Waverley Tennis', true, null]])
  assert.deepEqual(data.clubs.map(c => [c.name, c.status, c.endDate]), [['Glen Waverley TC', 'ACTIVE', null], ['Mount Waverley TC', 'INACTIVE', '2025-01-01']])
  assert.deepEqual(data.teams.map(t => [t.name, t.seasonLabel, t.seasonStatus]), [['Mount Waverley A', 'Winter 2026', 'ACTIVE'], ['Glen Waverley A', 'Winter 2025', 'COMPLETED']])
})

test('TEAM-001: a team roster marks the logged-in player and keeps unusual statuses', async () => {
  const details = await memberships.teamDetails(EMAIL, mountA.id)
  assert.equal(details.clubName, 'Mount Waverley TC')
  assert.deepEqual(details.members.map(m => [m.name, m.status, m.isCurrentPlayer]), [['Chloe Cooper', 'ACTIVE', true], ['Yuki Green', 'EMERGENCY', false]])
})

test('TEAM-002: another team\'s roster is refused as not found', async () => {
  await assert.rejects(memberships.teamDetails(EMAIL, rivals.id), e => e.getStatus() === 404 && e.getResponse().code === 'TEAM_NOT_FOUND')
})

test('SUP-001: contacts name the current team manager and primary club admin; a revoked role names nobody', async () => {
  const contacts = await memberships.supportContacts(EMAIL)
  assert.equal(contacts.team.teamName, 'Mount Waverley A') // the ACTIVE season, not Glen Waverley A (2025)
  assert.equal(contacts.team.managerName, 'Yuki Green')
  assert.equal(contacts.team.phone, '03 2222 2222') // the club's number, never the volunteer's own
  assert.equal(contacts.club.adminName, 'Mei Tran')
  assert.equal(contacts.association.recordsSecretaryName, null)
})

// ── Unit: standings
test('STAND-001: standings convert decimals to numbers and flag the player\'s teams', async () => {
  const data = await standings.standings(EMAIL)
  assert.deepEqual(data.myTeamIds, ['team-mount-a', 'team-glen-a'])
  assert.equal(data.standings[0].winPercentage, 66.67)
  assert.equal(data.rankings[0].rating, 5.35)
  assert.equal(data.rankings[0].percentileRank, 88)
  assert.equal(data.sections[0].seasonLabel, 'Winter 2026')
})

test('STAND-002: finals name the premiers and runners-up from the awards', async () => {
  const { finals } = await standings.standings(EMAIL)
  assert.deepEqual(finals, [{ sectionId: 'sec-2025', premiersTeamId: 'team-glen-a', runnersUpTeamId: 'team-other' }])
})

test('PLAYER-003: a database failure is a 503 that leaks no connection details', async () => {
  databaseDown = true
  try {
    await assert.rejects(matches.fixtures(EMAIL), e => {
      assert.equal(e.getStatus(), 503)
      assert.doesNotMatch(JSON.stringify(e.getResponse()), /secret|db\.internal/)
      return true
    })
  } finally {
    databaseDown = false
  }
})

// ── Integration: HTTP routes with validation, guard and the fake database.
let app, url
before(async () => {
  const module = await Test.createTestingModule({ imports: [PrismaModule, PlayerModule] }).overrideProvider(PrismaService).useValue(prisma).compile()
  app = module.createNestApplication({ logger: false })
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true })) // as main.ts does
  await app.listen(0, '127.0.0.1')
  url = await app.getUrl()
})
after(async () => { await app?.close() })
const get = async path => {
  const response = await fetch(`${url}/api/v1/player/${path}`)
  return { status: response.status, body: await response.json() }
}

test('I-PLAYER-001: every player route answers { data } for a valid email', async () => {
  for (const path of ['competitions', 'fixtures', 'results', 'memberships', 'standings', 'support-contacts']) {
    const response = await get(`${path}?email=${EMAIL}`)
    assert.equal(response.status, 200, path)
    assert.ok('data' in response.body, path)
  }
  // A well-formed team ID that is not one of her teams is not found.
  assert.equal((await get(`teams/11111111-1111-4111-8111-111111111111?email=${EMAIL}`)).status, 404)
})

test('I-PLAYER-002: the email is normalised before lookup', async () => {
  const { status, body } = await get(`fixtures?email=${encodeURIComponent('  Chloe@Club.EXAMPLE ')}`)
  assert.equal(status, 200)
  assert.equal(body.data.length, 4)
})

test('I-PLAYER-003: a missing or malformed email, or a non-UUID team, is a 400', async () => {
  assert.equal((await get('fixtures')).status, 400)
  assert.equal((await get('fixtures?email=not-an-email')).status, 400)
  assert.equal((await get(`teams/not-a-uuid?email=${EMAIL}`)).status, 400)
})

test('I-PLAYER-004: routes are refused in production', async () => {
  const previous = process.env.NODE_ENV
  process.env.NODE_ENV = 'production'
  try {
    const { status, body } = await get(`fixtures?email=${EMAIL}`)
    assert.equal(status, 403)
    assert.equal(body.code, 'DEMO_DISABLED')
  } finally {
    process.env.NODE_ENV = previous
  }
})
