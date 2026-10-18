const { test } = require('node:test')
const assert = require('node:assert/strict')
const { normalizeName, parseWrittenName, firstNameFit, lastNameFit } = require('../dist/player-matching/names')
const { PlayerMatchingService } = require('../dist/player-matching/player-matching.service')

// In-memory stand-ins for the tables the matcher reads: nothing touches a database.
const date = value => new Date(`${value}T00:00:00Z`)
const person = (id, firstName, lastName, born) => ({ id, firstName, lastName, dateOfBirth: date(born) })
const season2025 = { startDate: date('2025-04-01'), endDate: date('2025-09-30') }
const season2026 = { startDate: date('2026-04-01'), endDate: date('2026-09-30') }
const teams = [
  { id: 'glen-2025', name: 'Glen Waverley A', section: { season: season2025 } },
  { id: 'glen-2026', name: 'Glen Waverley A', section: { season: season2026 } },
  { id: 'mount-2026', name: 'Mount Waverley A', section: { season: season2026 } },
]
const people = {
  jack: person('p-jack', 'Jack', 'Smith', '1990-08-08'),
  joshua: person('p-joshua', 'Joshua', 'Smith', '1999-04-02'),
  jacob: person('p-jacob', 'Jacob', 'Smith', '2001-06-15'),
  william: person('p-william', 'William', 'Turner', '1995-01-20'),
  mei: person('p-mei', 'Mei', 'Tran', '1998-11-30'),
  joshBrown: person('p-josh-brown', 'Josh', 'Brown', '2000-02-02'),
}
const rosters = [
  ['glen-2025', people.jack],
  ['glen-2026', people.joshua], ['glen-2026', people.jacob], ['glen-2026', people.william], ['glen-2026', people.mei],
  ['mount-2026', people.joshBrown],
].map(([teamId, player]) => ({ teamId, team: { name: teams.find(t => t.id === teamId).name }, player }))

const matcher = () => new PlayerMatchingService({
  team: {
    findUnique: async ({ where }) => teams.find(t => t.id === where.id) ?? null,
    findMany: async ({ where }) => teams.filter(t => t.name.toLowerCase() === where.name.equals.toLowerCase()),
  },
  teamPlayer: { findMany: async ({ where }) => rosters.filter(r => where.teamId.in.includes(r.teamId)) },
})
/** A name as written on a Glen Waverley A scoresheet from 10 May 2026, unless changed. */
const match = (name, changes = {}) => matcher().matchRecordedPlayer({ name, teamName: 'Glen Waverley A', matchDate: '2026-05-10', ...changes })

test('MATCH-001: written names are compared the way scoresheets write them', () => {
  assert.equal(normalizeName("  O'Brien-Müller "), 'obrien muller')
  assert.deepEqual(parseWrittenName('Josh Smith'), { kind: 'full', first: 'josh', last: 'smith' })
  assert.deepEqual(parseWrittenName('Smith, Josh'), { kind: 'full', first: 'josh', last: 'smith' })
  assert.deepEqual(parseWrittenName('J.Smith'), { kind: 'full', first: 'j', last: 'smith' })
  assert.deepEqual(parseWrittenName('Josh'), { kind: 'single', word: 'josh' })
  assert.equal(parseWrittenName(' , '), null)
  // A first name fits when it is the same, an initial, the start of the name or a nickname, either way round.
  for (const [written, registered] of [['joshua', 'Joshua'], ['J', 'Joshua'], ['Josh', 'Joshua'], ['Joshua', 'Josh'], ['Bill', 'William'], ['Liam', 'William'], ['Bill', 'Will'], ['Ed', 'Edward']]) {
    assert.ok(firstNameFit(written, registered), `${written} should fit ${registered}`)
  }
  for (const [written, registered] of [['Jo', 'Joshua'], ['Jack', 'Joshua'], ['K', 'Joshua'], ['', 'Joshua']]) {
    assert.equal(firstNameFit(written, registered), null, `${written} should not fit ${registered}`)
  }
  assert.equal(firstNameFit('Bill', 'Will'), 'Bill and Will are both short for William')
  assert.equal(lastNameFit('', 'Smith'), 'surname missing')
  assert.equal(lastNameFit('S', 'Smith'), 'surname initial S')
  assert.equal(lastNameFit("o'brien", 'OBrien'), 'same surname')
  assert.equal(lastNameFit('Smyth', 'Smith'), null)
})

test('MATCH-002: the one player on the team\'s roster who fits the written name is matched', async () => {
  for (const [written, expected] of [['Josh', 'Joshua Smith'], ['Josh S', 'Joshua Smith'], ['Bill Turner', 'William Turner'], ['Turner', 'William Turner'], ['M. Tran', 'Mei Tran'], ['Tran, Mei', 'Mei Tran']]) {
    const result = await match(written)
    assert.equal(result.status, 'matched', written)
    assert.equal(result.name, expected, written)
  }
  assert.deepEqual((await match('Josh')).reasons, ['Josh is short for Joshua', 'surname missing', 'on the Glen Waverley A roster'])
  // By team id as well, and a team name ignores case and spacing.
  assert.equal((await matcher().matchRecordedPlayer({ name: 'Josh', teamId: 'glen-2026', matchDate: date('2026-05-10') })).name, 'Joshua Smith')
  assert.equal((await match('Josh', { teamName: '  glen waverley a ' })).name, 'Joshua Smith')
})

test('MATCH-003: two players who fit are offered, never guessed; a different birthday rules a player out', async () => {
  const both = await match('J. Smith')
  assert.equal(both.status, 'ambiguous')
  assert.deepEqual(both.candidates.map(c => c.name), ['Jacob Smith', 'Joshua Smith'])
  assert.equal((await match('Smith')).status, 'ambiguous')
  const settled = await match('J. Smith', { dateOfBirth: '1999-04-02' })
  assert.equal(settled.name, 'Joshua Smith')
  assert.ok(settled.reasons.includes('same date of birth'))
  const wrongBirthday = await match('Josh', { dateOfBirth: '2000-01-01' })
  assert.equal(wrongBirthday.status, 'unmatched')
  assert.match(wrongBirthday.reason, /born 2000-01-01/)
  // Nobody fits; and Josh Brown, on another team, is never considered.
  assert.equal((await match('Pat')).status, 'unmatched')
  assert.equal((await match('Josh Brown')).status, 'unmatched')
})

test('MATCH-004: the match date picks which season\'s roster is searched; missing details are reported, not thrown', async () => {
  assert.equal((await match('J. Smith', { matchDate: '2025-06-01' })).name, 'Jack Smith')
  assert.match((await match('Josh', { matchDate: '2027-01-10' })).reason, /no season that includes 2027-01-10/)
  assert.equal((await match('   ')).reason, 'No name was written')
  assert.match((await match('Josh', { matchDate: 'soon' })).reason, /not a match date/)
  assert.match((await match('Josh', { teamName: 'Nowhere FC' })).reason, /No team called "Nowhere FC"/)
  assert.match((await matcher().matchRecordedPlayer({ name: 'Josh', teamId: 'missing', matchDate: '2026-05-10' })).reason, /No team with id missing/)
})

// Duplicate-scan stand-ins: who is registered, who played in which match, clubs, earlier requests.
const duplicateFixtures = () => ({
  players: [
    person('a-joshua', 'Joshua', 'Smith', '1999-04-02'), person('b-josh', 'Josh', 'Smith', '1999-04-02'), // probably one person
    person('c-hiro', 'Hiro', 'Mitchell', '1993-03-15'), person('d-hiro', 'Hiro', 'Mitchell', '2004-02-26'), // look-alikes: different birthdays
    person('e-thomas', 'Thomas', 'Brown', '1990-01-01'), person('f-tom', 'Tom', 'Brown', '1990-01-01'), // played in one match: two people
    person('g-william', 'William', 'Turner', '1995-01-20'), person('h-bill', 'Bill', 'Turner', '1995-01-20'), // already rejected
    person('i-emma', 'Emma', 'Lee', '2002-07-07'), person('j-emma', 'Emma', 'Leigh', '2002-07-07'), // different surnames
    person('k-mei', 'Mei', 'Tran', '1998-11-30'), person('l-mei', 'Mei', 'Tran', '1998-11-30'), // registered twice exactly
  ],
  played: [['a-joshua', 'fixture-2'], ['b-josh', 'fixture-3'], ['e-thomas', 'fixture-1'], ['f-tom', 'fixture-1']],
  clubs: [['a-joshua', 'Glen Waverley TC'], ['b-josh', 'Glen Waverley TC'], ['b-josh', 'Mount Waverley TC']],
  requests: [{ playerAId: 'h-bill', playerBId: 'g-william', status: 'REJECTED' }],
})

function registry({ players, played = [], clubs = [], requests = [] }) {
  const merge = [...requests]
  const service = new PlayerMatchingService({
    player: { findMany: async () => [...players].sort((a, b) => a.id.localeCompare(b.id)) },
    profileMergeRequest: {
      findMany: async ({ where }) => merge.filter(r => where.OR[0].playerAId.in.includes(r.playerAId) || where.OR[1].playerBId.in.includes(r.playerBId)),
      createMany: async ({ data }) => { merge.push(...data); return { count: data.length } },
    },
    rubberPlayer: {
      findMany: async ({ where }) => played.filter(([id]) => where.playerId.in.includes(id)).map(([playerId, fixtureId]) => ({ playerId, rubber: { matchResult: { fixtureId } } })),
    },
    clubMembership: {
      findMany: async ({ where }) => clubs.filter(([id]) => where.playerId.in.includes(id)).map(([playerId, name]) => ({ playerId, club: { name } })),
    },
  })
  return { service, merge }
}

test('DUP-001: same birthday and fitting names are flagged; look-alikes, opponents and decided pairs are not', async () => {
  const pairs = await registry(duplicateFixtures()).service.findDuplicateProfiles()
  assert.deepEqual(pairs.map(p => p.names), [['Joshua Smith', 'Josh Smith'], ['Mei Tran', 'Mei Tran']])
  assert.deepEqual(pairs[0], {
    playerAId: 'a-joshua', playerBId: 'b-josh', names: ['Joshua Smith', 'Josh Smith'], dateOfBirth: '1999-04-02',
    reasons: ['same date of birth', 'Josh is short for Joshua', 'same surname', 'both at Glen Waverley TC'],
  })
  assert.deepEqual(await registry({ players: [people.joshua, people.jacob] }).service.findDuplicateProfiles(), [])
})

test('DUP-002: each new pair gets one pending merge request saying why; running again adds none', async () => {
  const { service, merge } = registry(duplicateFixtures())
  assert.equal((await service.raiseMergeRequests()).length, 2)
  const pending = merge.filter(r => r.status === 'PENDING')
  assert.deepEqual(pending.map(r => [r.playerAId, r.playerBId]), [['a-joshua', 'b-josh'], ['k-mei', 'l-mei']])
  assert.equal(pending[0].note, 'Found automatically: Joshua Smith and Josh Smith may be one person (same date of birth; Josh is short for Joshua; same surname; both at Glen Waverley TC). Confirm before merging.')
  assert.deepEqual(await service.raiseMergeRequests(), [])
  assert.equal(merge.length, 3)
})
