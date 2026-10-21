const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { Prisma } = require('@prisma/client')
const { ClubAdminModule } = require('../dist/club-admin/club-admin.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')

// Route and body IDs must be UUIDs.
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const [GLEN_A, GLEN_B, GLEN_OLD, MOUNT_A, MOUNT_UP] = [1, 2, 3, 4, 5].map(id)
const [SEC_ACTIVE, SEC_OLD, SEC_UP1, SEC_UP2, SEC_OTHER] = [11, 12, 13, 14, 15].map(id)
const [AVA, BEN, CARA, DAN, EVE, FRANK, GUS, HANK, MARGARET, MOUNT_ONLY, CARA_DUP] = [21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map(id)
const GHOST = id(99)

// ── Waverley runs the seniors: 2025 is over, 2026 is running, 2027 takes entries.
// Another association's 2027 season is never Glen's to enter.
const seniors = { id: 'comp-seniors', name: 'Weekend Senior', associationId: 'assoc-waverley' }
const otherComp = { id: 'comp-other', name: 'Other Senior', associationId: 'assoc-other' }
const season = (seasonId, competition, year, status) => ({
  id: seasonId, competitionId: competition.id, competition, seasonType: 'Summer', year, startDate: null, endDate: null, status,
})
const seasons = {
  s2025: season('season-2025', seniors, 2025, 'COMPLETED'),
  s2026: season('season-2026', seniors, 2026, 'ACTIVE'),
  s2027: season('season-2027', seniors, 2027, 'UPCOMING'),
  other: season('season-other', otherComp, 2027, 'UPCOMING'),
}
const sections = [
  { id: SEC_ACTIVE, name: 'Section 1', season: seasons.s2026 },
  { id: SEC_OLD, name: 'Section 1', season: seasons.s2025 },
  { id: SEC_UP1, name: 'Section 1', season: seasons.s2027 },
  { id: SEC_UP2, name: 'Section 2', season: seasons.s2027 },
  { id: SEC_OTHER, name: 'Section 1', season: seasons.other },
].map(s => ({ ...s, seasonId: s.season.id, gender: null, ageGroup: 'Adult' }))
const sectionById = sectionId => sections.find(s => s.id === sectionId)
const clubs = {
  'club-glen': { id: 'club-glen', name: 'Glen Waverley Tennis Club', associationId: 'assoc-waverley' },
  'club-mount': { id: 'club-mount', name: 'Mount Waverley Tennis Club', associationId: 'assoc-waverley' },
}

let teams, people, users, roles, memberships, teamPlayers, audit, nextId

/** A fresh world for every test, so writes in one never leak into the next. */
function reset() {
  nextId = 1000
  const team = (teamId, name, clubId, sectionId) => ({ id: teamId, name, clubId, sectionId, seasonId: sectionById(sectionId).seasonId })
  teams = [
    team(GLEN_A, 'Glen Waverley 1', 'club-glen', SEC_ACTIVE),
    team(GLEN_B, 'Glen Waverley 2', 'club-glen', SEC_ACTIVE),
    team(GLEN_OLD, 'Glen Waverley 1', 'club-glen', SEC_OLD),
    team(MOUNT_A, 'Mount Waverley 1', 'club-mount', SEC_ACTIVE),
    team(MOUNT_UP, 'Mount Waverley 1', 'club-mount', SEC_UP1),
  ]
  const person = (playerId, firstName, lastName, extra = {}) => ({
    id: playerId, code: null, firstName, lastName, dateOfBirth: new Date('1990-01-01'), gender: 'FEMALE', isJunior: false,
    phone: '0400 000 000', status: 'ACTIVE', mergeIntoId: null, userId: null, ...extra,
  })
  people = [
    person(AVA, 'Ava', 'Clark', { userId: 'user-ava' }),
    person(BEN, 'Ben', 'Adams'),
    person(CARA, 'Cara', 'Brown', { code: 'PLR023', dateOfBirth: new Date('1995-06-15'), userId: 'user-cara' }),
    person(DAN, 'Dan', 'Evans', { userId: 'user-dan' }),
    person(EVE, 'Eve', 'Fox', { userId: 'user-eve' }),
    person(FRANK, 'Frank', 'Green', { userId: 'user-frank' }),
    person(GUS, 'Gus', 'Hill', { status: 'INACTIVE', userId: 'user-gus' }),
    person(HANK, 'Hank', 'Irwin'),
    person(MARGARET, 'Margaret', 'Hayes', { userId: 'user-admin' }),
    person(MOUNT_ONLY, 'Mount', 'Only'),
    person(CARA_DUP, 'Cara', 'Brown', { dateOfBirth: new Date('1995-06-15'), mergeIntoId: CARA }),
  ]
  users = ['admin', 'ava', 'cara', 'dan', 'eve', 'frank', 'gus', 'chloe'].map(name => ({
    id: `user-${name}`, email: name === 'admin' ? 'admin.glen@admin.example' : `${name}@club.example`,
  }))
  const role = (userId, roleType, extra = {}) => ({
    id: `role-${userId}`, userId, roleType, contextType: 'GLOBAL', associationId: null, clubId: null, teamId: null,
    competitionId: null, grantedAt: new Date('2026-01-01'), revokedAt: null, ...extra,
  })
  roles = [
    role('user-admin', 'CLUB_ADMIN', { contextType: 'CLUB', clubId: 'club-glen' }),
    role('user-ava', 'TEAM_MANAGER', { contextType: 'TEAM', clubId: 'club-glen', teamId: GLEN_A }),
    role('user-cara', 'PLAYER'),
    role('user-dan', 'PLAYER'),
    role('user-eve', 'TEAM_MANAGER', { contextType: 'TEAM', clubId: 'club-glen', teamId: GLEN_OLD }),
    role('user-frank', 'TEAM_MANAGER', { contextType: 'TEAM', clubId: 'club-glen', teamId: GLEN_B }),
    role('user-gus', 'PLAYER'),
    role('user-chloe', 'PLAYER'),
  ]
  const membership = (playerId, clubId, extra = {}) => ({
    id: `m-${playerId}-${clubId}`, playerId, clubId, isPrimary: true, status: 'ACTIVE', startDate: new Date('2025-05-06'), endDate: null, ...extra,
  })
  memberships = [
    membership(AVA, 'club-glen'),
    membership(BEN, 'club-glen', { status: 'INACTIVE', endDate: new Date('2026-03-01') }),
    membership(CARA, 'club-mount'),
    membership(CARA, 'club-glen', { isPrimary: false }),
    membership(DAN, 'club-glen'),
    membership(EVE, 'club-glen'),
    membership(FRANK, 'club-glen'),
    membership(GUS, 'club-glen'),
    membership(HANK, 'club-glen'),
    membership(MARGARET, 'club-glen'),
    membership(MOUNT_ONLY, 'club-mount'),
  ]
  teamPlayers = [
    { teamId: GLEN_A, playerId: AVA, status: 'ACTIVE', registerAt: new Date('2026-04-01T00:00:00Z') },
    { teamId: GLEN_A, playerId: CARA, status: 'EMERGENCY', registerAt: null },
    { teamId: GLEN_A, playerId: DAN, status: 'INACTIVE', registerAt: new Date('2026-04-01T00:00:00Z') },
    { teamId: MOUNT_A, playerId: MOUNT_ONLY, status: 'ACTIVE', registerAt: null },
  ]
  audit = []
}

// ── The fake Prisma: just enough of each query the club admin services make.
const teamById = teamId => teams.find(t => t.id === teamId)
const personById = playerId => people.find(p => p.id === playerId)
const userById = userId => users.find(u => u.id === userId)
const roleOf = userId => roles.find(r => r.userId === userId) ?? null
const withSection = team => ({ ...team, section: sectionById(team.sectionId) })
const userOf = person => {
  const user = person.userId ? userById(person.userId) : null
  return user ? { ...user, userRole: roleOf(user.id) } : null
}
const membershipsOf = (playerId, where = {}) => memberships
  .filter(m => m.playerId === playerId && (where.clubId === undefined || m.clubId === where.clubId))
  .map(m => ({ ...m, club: { name: clubs[m.clubId].name } }))
const placesOf = (playerId, where = {}) => teamPlayers
  .filter(tp => tp.playerId === playerId && (where.teamId === undefined || tp.teamId === where.teamId)
    && (where.team?.clubId === undefined || teamById(tp.teamId).clubId === where.team.clubId))
  .map(tp => ({ ...tp, team: withSection(teamById(tp.teamId)) }))
// The player with every relation the services include, filtered as they ask.
const fullPerson = (person, include = {}) => ({
  ...person,
  user: userOf(person),
  clubMemberships: membershipsOf(person.id, include.clubMemberships?.where),
  teamPlayers: placesOf(person.id, include.teamPlayers?.where),
})
const uniqueViolation = () => new Prisma.PrismaClientKnownRequestError('Unique constraint failed', { code: 'P2002', clientVersion: Prisma.prismaVersion.client })
const startsWith = (value, filter) => value.toLowerCase().startsWith(filter.startsWith.toLowerCase())

const prisma = {
  $transaction: async run => run(prisma),
  user: { findUnique: async ({ where }) => users.find(u => u.email === where.email) ?? null },
  userRole: {
    findFirst: async ({ where }) => {
      const role = roles.find(r => r.roleType === where.roleType && r.revokedAt === null
        && (where.userId === undefined || r.userId === where.userId)
        && (where.clubId === undefined || r.clubId !== null)
        && (where.teamId === undefined || r.teamId === where.teamId)
        && (where.associationId === undefined || r.associationId === where.associationId))
      if (!role) return null
      const profile = people.find(p => p.userId === role.userId) ?? null
      return { ...role, user: { email: userById(role.userId).email, profile } }
    },
    updateMany: async ({ where, data }) => {
      const matched = roles.filter(r => r.roleType === where.roleType && r.teamId === where.teamId && r.revokedAt === null)
      matched.forEach(r => Object.assign(r, data))
      return { count: matched.length }
    },
    upsert: async ({ where, create, update }) => {
      const role = roleOf(where.userId)
      if (role) return Object.assign(role, update)
      roles.push({ id: `role-${nextId++}`, ...create })
      return roleOf(where.userId)
    },
  },
  club: { findUnique: async ({ where }) => clubs[where.id] ?? null },
  sectionGrade: {
    findUnique: async ({ where }) => sectionById(where.id) ?? null,
    findMany: async ({ where }) => sections
      .filter(s => s.season.status === where.season.status && s.season.competition.associationId === where.season.competition.associationId)
      .map(s => ({ ...s, _count: { teams: teams.filter(t => t.sectionId === s.id).length } })),
  },
  team: {
    findFirst: async ({ where }) => {
      const found = teams.find(t => t.id === where.id && t.clubId === where.clubId)
      if (!found) return null
      return { ...withSection(found), teamPlayers: teamPlayers.filter(tp => tp.teamId === found.id).map(tp => ({ ...tp, player: personById(tp.playerId) })) }
    },
    findUnique: async ({ where }) => (teamById(where.id) ? withSection(teamById(where.id)) : null),
    create: async ({ data }) => {
      const key = name => name.trim().toLowerCase()
      if (teams.some(t => t.seasonId === data.seasonId && key(t.name) === key(data.name))) throw uniqueViolation()
      const team = { id: id(nextId++), ...data }
      teams.push(team)
      return team
    },
  },
  player: {
    findUnique: async ({ where, include }) => (personById(where.id) ? fullPerson(personById(where.id), include) : null),
    findMany: async ({ where, include }) => {
      if (where.id?.in) return people.filter(p => where.id.in.includes(p.id)).map(p => fullPerson(p, include))
      return people
        .filter(p => p.mergeIntoId === where.mergeIntoId)
        .filter(p => (where.lastName ? startsWith(p.lastName, where.lastName) : where.OR.some(or => startsWith(p[Object.keys(or)[0]], Object.values(or)[0]))))
        .map(p => fullPerson(p, include))
    },
    findFirst: async ({ where, include }) => {
      if (where.clubMemberships) {
        // ClubAdminService.playerDetail: a member of the club, with every membership and this club's teams.
        const clubId = where.clubMemberships.some.clubId
        if (!memberships.some(m => m.playerId === where.id && m.clubId === clubId)) return null
        return fullPerson(personById(where.id), include)
      }
      // createPlayer's duplicate check: same name, ignoring case, and date of birth.
      const same = (a, b) => a.toLowerCase() === b.equals.toLowerCase()
      return people.find(p => p.mergeIntoId === null && p.dateOfBirth.getTime() === where.dateOfBirth.getTime()
        && same(p.firstName, where.firstName) && same(p.lastName, where.lastName)) ?? null
    },
    create: async ({ data }) => {
      const { clubMemberships, ...fields } = data
      const person = { id: id(nextId++), phone: null, mergeIntoId: null, userId: null, ...fields }
      people.push(person)
      memberships.push({ id: `m-${nextId++}`, playerId: person.id, endDate: null, ...clubMemberships.create })
      return person
    },
  },
  teamPlayer: {
    findUnique: async ({ where, include }) => {
      const { teamId, playerId } = where.teamId_playerId
      const entry = teamPlayers.find(tp => tp.teamId === teamId && tp.playerId === playerId)
      return entry ? { ...entry, player: include?.player ? personById(playerId) : undefined } : null
    },
    upsert: async ({ where, create, update }) => {
      const { teamId, playerId } = where.teamId_playerId
      const entry = teamPlayers.find(tp => tp.teamId === teamId && tp.playerId === playerId)
      if (entry) return Object.assign(entry, update)
      teamPlayers.push({ ...create })
      return create
    },
    update: async ({ where, data }) => {
      const { teamId, playerId } = where.teamId_playerId
      return Object.assign(teamPlayers.find(tp => tp.teamId === teamId && tp.playerId === playerId), data)
    },
  },
  clubMembership: {
    upsert: async ({ where, create, update }) => {
      const { playerId, clubId } = where.playerId_clubId
      const existing = memberships.find(m => m.playerId === playerId && m.clubId === clubId)
      if (existing) return Object.assign(existing, update)
      memberships.push({ id: `m-${nextId++}`, ...create })
      return create
    },
  },
  auditLog: { create: async ({ data }) => { audit.push(data); return data } },
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
beforeEach(reset)

const ADMIN = 'admin.glen@admin.example'
async function call(method, path, { body, email = ADMIN, query = {} } = {}) {
  const params = new URLSearchParams({ ...(email === undefined ? {} : { email }), ...query })
  const response = await fetch(`${url}/api/v1/club-admin/${path}?${params}`, {
    method,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  return { status: response.status, body: await response.json() }
}
const squadOf = teamId => Object.fromEntries(teamPlayers.filter(tp => tp.teamId === teamId).map(tp => [personById(tp.playerId).firstName, tp.status]))

test('I-CLUBEDIT-001: open sections are the association\'s UPCOMING ones, empty or not, with their team count', async () => {
  const { status, body } = await call('GET', 'open-sections')
  assert.equal(status, 200)
  assert.deepEqual(body.data.map(s => [s.id, s.name, s.seasonStatus, s.competitionName, s.teamCount]), [
    [SEC_UP1, 'Section 1', 'UPCOMING', 'Weekend Senior', 1],
    [SEC_UP2, 'Section 2', 'UPCOMING', 'Weekend Senior', 0],
  ])
})

test('I-CLUBEDIT-002: creating a team enters it in the section\'s season and logs who did it', async () => {
  const { status, body } = await call('POST', 'teams', { body: { sectionId: SEC_UP2, name: '  Glen   Waverley 1 ' } })
  assert.equal(status, 201)
  assert.equal(body.data.name, 'Glen Waverley 1')
  assert.equal(body.data.sectionId, SEC_UP2)
  assert.equal(body.data.seasonId, 'season-2027')
  assert.deepEqual(body.data.players, [])
  assert.equal(body.data.managerName, null)
  assert.deepEqual(teams.at(-1), { id: body.data.id, clubId: 'club-glen', sectionId: SEC_UP2, seasonId: 'season-2027', name: 'Glen Waverley 1' })
  assert.deepEqual(audit, [{ entityType: 'TEAM', entityId: body.data.id, action: 'CREATE', changeSummary: 'Entered Glen Waverley 1 in Section 2', changedBy: 'user-admin' }])
})

test('I-CLUBEDIT-003: a team cannot enter a running season, another association\'s section, or reuse a name in the season', async () => {
  const running = await call('POST', 'teams', { body: { sectionId: SEC_ACTIVE, name: 'Glen Waverley 3' } })
  assert.equal(running.status, 409)
  assert.equal(running.body.code, 'SEASON_NOT_OPEN')
  for (const sectionId of [SEC_OTHER, GHOST]) {
    const { status, body } = await call('POST', 'teams', { body: { sectionId, name: 'Glen Waverley 3' } })
    assert.equal(status, 404, sectionId)
    assert.equal(body.code, 'SECTION_NOT_FOUND')
  }
  // Mount Waverley 1 is in Section 1; names are unique across the whole season, whatever the case.
  const taken = await call('POST', 'teams', { body: { sectionId: SEC_UP2, name: 'mount waverley 1' } })
  assert.equal(taken.status, 409)
  assert.equal(taken.body.code, 'TEAM_NAME_TAKEN')
  assert.equal((await call('POST', 'teams', { body: { sectionId: SEC_UP2, name: '   ' } })).status, 400)
  assert.equal((await call('POST', 'teams', { body: { sectionId: 'SEC02', name: 'Glen Waverley 3' } })).status, 400)
  assert.equal(teams.length, 5)
  assert.deepEqual(audit, [])
})

test('I-CLUBEDIT-004: adding players makes them ACTIVE, bringing back a former and an emergency player', async () => {
  const before = Date.now()
  const { status, body } = await call('POST', `teams/${GLEN_A}/players`, { body: { playerIds: [HANK, DAN, CARA, HANK] } })
  assert.equal(status, 200)
  assert.deepEqual(squadOf(GLEN_A), { Ava: 'ACTIVE', Cara: 'ACTIVE', Dan: 'ACTIVE', Hank: 'ACTIVE' })
  const hank = teamPlayers.find(tp => tp.teamId === GLEN_A && tp.playerId === HANK)
  assert.ok(hank.registerAt.getTime() >= before)
  assert.deepEqual(body.data.players.map(p => [p.firstName, p.status]), [['Ava', 'ACTIVE'], ['Cara', 'ACTIVE'], ['Dan', 'ACTIVE'], ['Hank', 'ACTIVE']])
  assert.deepEqual(audit.map(a => [a.entityId, a.action, a.changeSummary]), [[GLEN_A, 'ADD_PLAYERS', 'Added Hank Irwin, Dan Evans, Cara Brown']])
})

test('I-CLUBEDIT-005: one ineligible player refuses the whole request and names every problem', async () => {
  const { status, body } = await call('POST', `teams/${GLEN_A}/players`, {
    body: { playerIds: [HANK, AVA, BEN, GUS, MOUNT_ONLY, MARGARET, CARA_DUP, GHOST] },
  })
  assert.equal(status, 422)
  assert.equal(body.code, 'PLAYERS_NOT_ELIGIBLE')
  assert.deepEqual(body.players, [
    { id: AVA, reason: 'ALREADY_IN_TEAM' },
    { id: BEN, reason: 'NOT_CLUB_MEMBER' }, // membership ended
    { id: GUS, reason: 'INACTIVE_PLAYER' },
    { id: MOUNT_ONLY, reason: 'NOT_CLUB_MEMBER' },
    { id: MARGARET, reason: 'PLAYER_NOT_FOUND' }, // the club admin's own profile
    { id: CARA_DUP, reason: 'PLAYER_NOT_FOUND' }, // merged away
    { id: GHOST, reason: 'PLAYER_NOT_FOUND' },
  ])
  assert.equal(squadOf(GLEN_A).Hank, undefined, 'Hank is eligible but nothing is written')
  assert.deepEqual(audit, [])
  assert.equal((await call('POST', `teams/${GLEN_A}/players`, { body: { playerIds: [] } })).status, 400)
  assert.equal((await call('POST', `teams/${GLEN_A}/players`, { body: { playerIds: ['PLR100'] } })).status, 400)
})

test('I-CLUBEDIT-006: another club\'s team is a 404 and a finished season\'s squad is closed', async () => {
  const other = await call('POST', `teams/${MOUNT_A}/players`, { body: { playerIds: [HANK] } })
  assert.equal(other.status, 404)
  assert.equal(other.body.code, 'TEAM_NOT_FOUND')
  for (const [method, path, body] of [
    ['POST', `teams/${GLEN_OLD}/players`, { playerIds: [HANK] }],
    ['DELETE', `teams/${GLEN_OLD}/players/${AVA}`],
    ['PUT', `teams/${GLEN_OLD}/manager`, { playerId: DAN }],
  ]) {
    const response = await call(method, path, { body })
    assert.equal(response.status, 409, path)
    assert.equal(response.body.code, 'SEASON_CLOSED', path)
  }
  assert.deepEqual(audit, [])
})

test('I-CLUBEDIT-007: removing a player keeps their row as INACTIVE; someone not in the squad is a 404', async () => {
  const { status, body } = await call('DELETE', `teams/${GLEN_A}/players/${AVA}`)
  assert.equal(status, 200)
  assert.equal(squadOf(GLEN_A).Ava, 'INACTIVE')
  assert.equal(body.data.players.find(p => p.id === AVA).status, 'INACTIVE')
  assert.deepEqual(audit.map(a => [a.action, a.changeSummary]), [['REMOVE_PLAYER', 'Removed Ava Clark']])
  for (const playerId of [AVA, CARA, HANK]) { // now inactive, an emergency, never in it
    const again = await call('DELETE', `teams/${GLEN_A}/players/${playerId}`)
    assert.equal(again.status, 404)
    assert.equal(again.body.code, 'PLAYER_NOT_IN_TEAM')
  }
})

test('I-CLUBEDIT-008: assigning a manager replaces the old one, who becomes a plain player again', async () => {
  const { status, body } = await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId: DAN } })
  assert.equal(status, 200)
  assert.equal(body.data.managerName, 'Dan Evans')
  // The answer names the new manager's Player ID, which the page uses to mark them in the squad.
  assert.deepEqual(body.data.manager, { playerId: DAN, playerCode: null, name: 'Dan Evans', email: 'dan@club.example' })
  const { id: _dan, grantedAt: danGranted, ...dan } = roleOf('user-dan')
  assert.deepEqual(dan, { userId: 'user-dan', roleType: 'TEAM_MANAGER', contextType: 'TEAM', associationId: null, clubId: 'club-glen', teamId: GLEN_A, competitionId: null, revokedAt: null })
  assert.ok(danGranted > new Date('2026-01-01'))
  const ava = roleOf('user-ava')
  assert.deepEqual([ava.roleType, ava.contextType, ava.clubId, ava.teamId, ava.revokedAt], ['PLAYER', 'GLOBAL', null, null, null])
  assert.deepEqual(audit.map(a => [a.entityId, a.action, a.changeSummary]), [[GLEN_A, 'ASSIGN_MANAGER', 'Made Dan Evans team manager']])
  // Assigning the current manager again changes nothing.
  assert.equal((await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId: DAN } })).status, 200)
  assert.equal(audit.length, 1)
})

test('I-CLUBEDIT-009: a manager from a finished season can move to a new team, but not one whose team is still playing', async () => {
  const eve = await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId: EVE } })
  assert.equal(eve.status, 200)
  assert.equal(roleOf('user-eve').teamId, GLEN_A)
  const frank = await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId: FRANK } })
  assert.equal(frank.status, 409)
  assert.equal(frank.body.code, 'MANAGES_ANOTHER_TEAM')
  assert.equal(roleOf('user-frank').teamId, GLEN_B)
})

test('I-CLUBEDIT-010: a manager needs to be an active club member with a login account and no other role', async () => {
  for (const [playerId, reason] of [[HANK, 'NO_LOGIN_ACCOUNT'], [GUS, 'INACTIVE_PLAYER'], [BEN, 'NOT_CLUB_MEMBER'], [MOUNT_ONLY, 'NOT_CLUB_MEMBER']]) {
    const { status, body } = await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId } })
    assert.equal(status, 422, reason)
    assert.equal(body.code, 'MANAGER_NOT_ELIGIBLE')
    assert.equal(body.reason, reason)
  }
  const admin = await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId: MARGARET } })
  assert.equal(admin.status, 409)
  assert.equal(admin.body.code, 'HOLDS_ANOTHER_ROLE')
  assert.equal((await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId: CARA_DUP } })).status, 404)
  assert.equal(roleOf('user-ava').teamId, GLEN_A, 'Ava is still the manager')
  assert.deepEqual(audit, [])
})

test('I-CLUBEDIT-011: removing the manager turns them back into a player; a team without one is a 404', async () => {
  const { status, body } = await call('DELETE', `teams/${GLEN_A}/manager`)
  assert.equal(status, 200)
  assert.equal(body.data.managerName, null)
  assert.equal(body.data.manager, null)
  assert.equal(roleOf('user-ava').roleType, 'PLAYER')
  assert.deepEqual(audit.map(a => a.action), ['REMOVE_MANAGER'])
  const again = await call('DELETE', `teams/${GLEN_A}/manager`)
  assert.equal(again.status, 404)
  assert.equal(again.body.code, 'NO_MANAGER')
  // A finished season's manager can still be removed, to free them up.
  assert.equal((await call('DELETE', `teams/${GLEN_OLD}/manager`)).status, 200)
  assert.equal(roleOf('user-eve').roleType, 'PLAYER')
})

test('I-CLUBEDIT-012: adding a registered player to the club starts a membership today and keeps their Player ID', async () => {
  const { status, body } = await call('POST', `players/${MOUNT_ONLY}/membership`)
  assert.equal(status, 201)
  assert.equal(body.data.id, MOUNT_ONLY)
  const glen = body.data.memberships.find(m => m.clubId === 'club-glen')
  // Mount stays their primary club.
  assert.deepEqual([glen.status, glen.isPrimary, glen.endDate], ['ACTIVE', false, null])
  assert.match(glen.startDate, /^\d{4}-\d{2}-\d{2}$/)
  assert.ok(glen.startDate > '2026-01-01')
  assert.deepEqual(audit.map(a => [a.entityType, a.entityId, a.action, a.changeSummary]), [['PLAYER', MOUNT_ONLY, 'JOIN_CLUB', 'Mount Only joined the club']])
})

test('I-CLUBEDIT-013: a former member rejoins on their old row; a current member, the admin or a merged profile cannot be added', async () => {
  const ben = await call('POST', `players/${BEN}/membership`)
  assert.equal(ben.status, 201)
  const row = memberships.filter(m => m.playerId === BEN)
  assert.equal(row.length, 1)
  assert.deepEqual([row[0].status, row[0].isPrimary, row[0].endDate], ['ACTIVE', true, null])
  const member = await call('POST', `players/${AVA}/membership`)
  assert.equal(member.status, 409)
  assert.equal(member.body.code, 'ALREADY_MEMBER')
  for (const playerId of [MARGARET, CARA_DUP, GHOST]) {
    const { status, body } = await call('POST', `players/${playerId}/membership`)
    assert.equal(status, 404, playerId)
    assert.equal(body.code, 'PLAYER_NOT_FOUND')
  }
  assert.equal(audit.length, 1)
})

test('I-CLUBEDIT-014: creating a player registers them as a primary member; the same name and birthday is refused', async () => {
  const { status, body } = await call('POST', 'players', { body: { firstName: ' Zoe ', lastName: 'Young', dateOfBirth: '2015-02-03', gender: 'FEMALE' } })
  assert.equal(status, 201)
  assert.deepEqual([body.data.firstName, body.data.lastName, body.data.dateOfBirth, body.data.isJunior, body.data.email], ['Zoe', 'Young', '2015-02-03', true, null])
  assert.deepEqual(body.data.memberships.map(m => [m.clubId, m.isPrimary, m.status]), [['club-glen', true, 'ACTIVE']])
  assert.deepEqual(audit.map(a => [a.entityId, a.action, a.changeSummary]), [[body.data.id, 'CREATE', 'Registered Zoe Young']])
  const adult = await call('POST', 'players', { body: { firstName: 'Yan', lastName: 'Xu', dateOfBirth: '1980-12-31', gender: 'OTHER' } })
  assert.equal(adult.body.data.isJunior, false)

  const duplicate = await call('POST', 'players', { body: { firstName: 'cara', lastName: 'BROWN', dateOfBirth: '1995-06-15', gender: 'FEMALE' } })
  assert.equal(duplicate.status, 409)
  assert.equal(duplicate.body.code, 'POSSIBLE_DUPLICATE')
  assert.deepEqual([duplicate.body.playerId, duplicate.body.playerCode], [CARA, 'PLR023'])
})

test('I-CLUBEDIT-015: a new player needs a name, a real date of birth and a gender', async () => {
  const valid = { firstName: 'Zoe', lastName: 'Young', dateOfBirth: '2015-02-03', gender: 'FEMALE' }
  for (const change of [{ firstName: ' ' }, { lastName: undefined }, { dateOfBirth: '03/02/2015' }, { dateOfBirth: '2015-02-30' }, { gender: undefined }, { gender: 'X' }]) {
    assert.equal((await call('POST', 'players', { body: { ...valid, ...change } })).status, 400, JSON.stringify(change))
  }
  assert.equal(people.length, 11)
})

test('I-CLUBEDIT-016: the registry search finds people by name, ranks by birthday and email, and shows no personal details', async () => {
  const { status, body } = await call('GET', 'registry/players', { query: { name: 'cara brown', dateOfBirth: '1995-06-15', playerEmail: 'Cara@Club.example' } })
  assert.equal(status, 200)
  assert.deepEqual(body.data, [{
    id: CARA, code: 'PLR023', firstName: 'Cara', lastName: 'Brown',
    match: { name: 'exact', nameReasons: ['same first name', 'same surname'], dateOfBirth: true, email: true },
    isJunior: false, inThisClub: true, otherClubs: ['Mount Waverley Tennis Club'],
  }])

  // A nickname still finds them; a wrong birthday ranks lower but hides nobody.
  const similar = await call('GET', 'registry/players', { query: { name: 'Benjamin Adams', dateOfBirth: '2000-01-01' } })
  assert.deepEqual(similar.body.data.map(p => [p.id, p.match.name, p.match.dateOfBirth, p.match.email, p.inThisClub]), [[BEN, 'similar', false, null, false]])

  // One word may be a first name or a surname; the club admin is never listed.
  const single = await call('GET', 'registry/players', { query: { name: 'Hayes' } })
  assert.deepEqual(single.body.data, [])
  const only = await call('GET', 'registry/players', { query: { name: 'Mount' } })
  assert.deepEqual(only.body.data.map(p => [p.id, p.inThisClub, p.otherClubs]), [[MOUNT_ONLY, false, ['Mount Waverley Tennis Club']]])

  assert.equal((await call('GET', 'registry/players', { query: { name: ' ' } })).status, 400)
  assert.equal((await call('GET', 'registry/players', { query: { name: 'Cara', dateOfBirth: '15/06/1995' } })).status, 400)
})

test('I-CLUBEDIT-017: only a club admin can make changes', async () => {
  for (const [method, path, body] of [
    ['POST', 'teams', { sectionId: SEC_UP2, name: 'Sneaky' }],
    ['POST', `teams/${GLEN_A}/players`, { playerIds: [HANK] }],
    ['DELETE', `teams/${GLEN_A}/players/${AVA}`],
    ['PUT', `teams/${GLEN_A}/manager`, { playerId: DAN }],
    ['DELETE', `teams/${GLEN_A}/manager`],
    ['POST', 'players', { firstName: 'Zoe', lastName: 'Young', dateOfBirth: '2015-02-03', gender: 'FEMALE' }],
    ['POST', `players/${MOUNT_ONLY}/membership`],
  ]) {
    const response = await call(method, path, { body, email: 'chloe@club.example' })
    assert.equal(response.status, 403, `${method} ${path}`)
    assert.equal(response.body.code, 'NOT_CLUB_ADMIN')
  }
  assert.deepEqual(audit, [])
  assert.equal(teams.length, 5)
})

test('I-CLUBEDIT-018: a database failure during a change is a 503 that leaks nothing', async () => {
  const original = prisma.$transaction
  prisma.$transaction = async () => { throw new Error('password=secret host=db.internal') }
  try {
    const { status, body } = await call('POST', `teams/${GLEN_A}/players`, { body: { playerIds: [HANK] } })
    assert.equal(status, 503)
    assert.equal(body.code, 'DATA_UNAVAILABLE')
    assert.ok(!JSON.stringify(body).includes('secret'))
  } finally {
    prisma.$transaction = original
  }
})

test('JUNIOR-003: another club\'s admin searching for a junior sees the name and a tick or cross, never the date of birth, email, phone or clubs', async () => {
  // Cara, a junior here, plays for Glen and Mount; the admin searching runs Syndal, which she is not in.
  Object.assign(personById(CARA), { isJunior: true, guardianName: 'Pat Brown', guardianEmail: 'pat.brown@families.example', guardianPhone: '0413 200 700' })
  users.push({ id: 'user-syndal-admin', email: 'admin.syndal@admin.example' })
  roles.push({
    id: 'role-syndal-admin', userId: 'user-syndal-admin', roleType: 'CLUB_ADMIN', contextType: 'CLUB', associationId: null,
    clubId: 'club-syndal', teamId: null, competitionId: null, grantedAt: new Date('2026-01-01'), revokedAt: null,
  })
  const search = query => call('GET', 'registry/players', { query, email: 'admin.syndal@admin.example' })
  const right = await search({ name: 'Cara Brown', dateOfBirth: '1995-06-15', playerEmail: 'cara@club.example' })
  assert.equal(right.status, 200)
  assert.deepEqual(right.body.data, [{
    id: CARA, code: 'PLR023', firstName: 'Cara', lastName: 'Brown',
    match: { name: 'exact', nameReasons: ['same first name', 'same surname'], dateOfBirth: true, email: true },
    isJunior: true, inThisClub: false, otherClubs: [],
  }])
  // A wrong date of birth or email is a cross, and the real values never appear either way.
  const wrong = await search({ name: 'Cara Brown', dateOfBirth: '1995-06-16', playerEmail: 'someone@else.example' })
  assert.deepEqual([wrong.body.data[0].match.dateOfBirth, wrong.body.data[0].match.email], [false, false])
  for (const body of [right.body, wrong.body]) {
    const text = JSON.stringify(body)
    for (const secret of ['1995-06-15', 'cara@club.example', '0400 000 000', 'Pat Brown', 'families.example', 'Glen Waverley', 'Mount Waverley']) {
      assert.equal(text.includes(secret), false, `${secret} leaked`)
    }
  }
  // An adult in the same search still shows where they play.
  personById(CARA).isJunior = false
  assert.deepEqual((await search({ name: 'Cara Brown' })).body.data[0].otherClubs, ['Glen Waverley Tennis Club', 'Mount Waverley Tennis Club'])
})

test('JUNIOR-014: a junior cannot be made a team manager, who would see other juniors\' parent contacts', async () => {
  // Cara has a login and is an active member, so only her age stands in the way.
  personById(CARA).isJunior = true
  const { status, body } = await call('PUT', `teams/${GLEN_A}/manager`, { body: { playerId: CARA } })
  assert.deepEqual([status, body.code, body.reason], [422, 'MANAGER_NOT_ELIGIBLE', 'UNDER_18'])
  assert.equal(roleOf('user-ava').teamId, GLEN_A, 'Ava is still the manager')
  assert.equal(roleOf('user-cara').roleType, 'PLAYER')
  assert.deepEqual(audit, [])
})
