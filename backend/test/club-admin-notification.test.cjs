const { test, before, after, beforeEach } = require('node:test')
const assert = require('node:assert/strict')
const { Test } = require('@nestjs/testing')
const { ValidationPipe } = require('@nestjs/common')
const { ClubAdminModule } = require('../dist/club-admin/club-admin.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')

// Route IDs must be UUIDs.
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const [REMINDER, VENUE, ENTRIES, READ, EMAIL_COPY, FINAL, OTHER_ADMIN, PLAYER_NOTICE] = [1, 2, 3, 4, 5, 6, 7, 8].map(id)

const users = [
  { id: 'user-admin', email: 'admin.glen@admin.example' },
  { id: 'user-mount-admin', email: 'admin.mount@admin.example' },
  { id: 'user-chloe', email: 'chloe@club.example' },
]
const roles = [
  { userId: 'user-admin', roleType: 'CLUB_ADMIN', clubId: 'club-glen', revokedAt: null },
  { userId: 'user-mount-admin', roleType: 'CLUB_ADMIN', clubId: 'club-mount', revokedAt: null },
  { userId: 'user-chloe', roleType: 'PLAYER', clubId: null, revokedAt: null },
]
const fixtures = [
  { id: 'fixture-r13', roundNumber: 13, roundLabel: null, homeTeam: { name: 'Syndal A' }, awayTeam: { name: 'Glen Waverley A' } },
  { id: 'fixture-r14', roundNumber: 14, roundLabel: null, homeTeam: { name: 'Mount Waverley A' }, awayTeam: { name: 'Glen Waverley A' } },
  { id: 'fixture-gf', roundNumber: null, roundLabel: 'Grand Final', homeTeam: { name: 'Glen Waverley A' }, awayTeam: { name: 'Pinewood A' } },
]
const READ_AT = new Date('2026-09-21T08:00:00Z')

let notifications, fixtureQueries
function reset() {
  fixtureQueries = 0
  const notice = (noticeId, userId, type, createdAt, extra = {}) => ({
    id: noticeId, userId, type, title: type, message: `${type} message`, details: null,
    targetType: 'FIXTURE', targetId: 'fixture-r13', channel: 'IN_APP', readAt: null, createdAt: new Date(createdAt), ...extra,
  })
  notifications = [
    notice(REMINDER, 'user-admin', 'MATCH_REMINDER', '2026-09-20T22:00:00Z', {
      details: { scheduledDate: '2026-09-27', scheduledTime: '13:00', venue: 'Syndal Tennis Centre', timeZone: 'Australia/Melbourne' },
    }),
    notice(VENUE, 'user-admin', 'VENUE_CHANGED', '2026-09-19T06:40:00Z', { targetId: 'fixture-r14' }),
    notice(ENTRIES, 'user-admin', 'COMPETITION_UPDATE', '2026-10-12T22:00:00Z', { targetType: 'COMPETITION', targetId: 'comp-seniors' }),
    notice(READ, 'user-admin', 'MATCH_DATE_CHANGED', '2026-09-19T03:20:00Z', { readAt: READ_AT, details: ['not', 'an', 'object'] }),
    notice(EMAIL_COPY, 'user-admin', 'MATCH_REMINDER', '2026-09-20T22:00:00Z', { channel: 'EMAIL' }),
    notice(FINAL, 'user-admin', 'DRAW_RELEASED', '2026-08-01T00:00:00Z', { targetId: 'fixture-gf' }),
    notice(OTHER_ADMIN, 'user-mount-admin', 'VENUE_CHANGED', '2026-09-19T06:40:00Z'),
    notice(PLAYER_NOTICE, 'user-chloe', 'MATCH_REMINDER', '2026-09-20T22:00:00Z'),
  ]
}

// Each fake filters by the fields the service puts in where, so a query that
// dropped the recipient or channel would return someone else's notices.
const matches = (row, where) => Object.entries(where).every(([key, value]) => row[key] === value)
const prisma = {
  user: { findUnique: async ({ where }) => users.find(u => u.email === where.email) ?? null },
  userRole: {
    findFirst: async ({ where }) => roles.find(r => r.userId === where.userId && r.roleType === where.roleType && r.revokedAt === null && r.clubId !== null) ?? null,
  },
  notification: {
    findMany: async ({ where }) => notifications.filter(row => matches(row, where))
      .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id)),
    findFirst: async ({ where }) => notifications.find(row => matches(row, where)) ?? null,
    update: async ({ where, data }) => Object.assign(notifications.find(row => row.id === where.id), data),
    updateMany: async ({ where, data }) => {
      const rows = notifications.filter(row => matches(row, where))
      rows.forEach(row => Object.assign(row, data))
      return { count: rows.length }
    },
  },
  fixture: {
    findMany: async ({ where }) => { fixtureQueries++; return fixtures.filter(f => where.id.in.includes(f.id)) },
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
beforeEach(reset)

const ADMIN = 'admin.glen@admin.example'
async function call(method, path, email = ADMIN) {
  const response = await fetch(`${url}/api/v1/club-admin/${path}?email=${encodeURIComponent(email)}`, { method })
  return { status: response.status, body: await response.json() }
}
const unread = userId => notifications.filter(row => row.userId === userId && row.channel === 'IN_APP' && row.readAt === null).map(row => row.id)

test('I-CLUBNOTE-001: the admin sees their own in-app notices, newest first, never email copies or anyone else\'s', async () => {
  const { status, body } = await call('GET', 'notifications')
  assert.equal(status, 200)
  assert.deepEqual(body.data.map(n => n.id), [ENTRIES, REMINDER, VENUE, READ, FINAL])
  assert.equal(fixtureQueries, 1, 'fixtures are looked up once for the whole list')
})

test('I-CLUBNOTE-002: a notice has the page\'s shape, with the fixture it is about named', async () => {
  const { body } = await call('GET', 'notifications')
  const byId = Object.fromEntries(body.data.map(n => [n.id, n]))
  assert.deepEqual(byId[REMINDER], {
    id: REMINDER, type: 'MATCH_REMINDER', title: 'MATCH_REMINDER', message: 'MATCH_REMINDER message',
    match: 'Round 13 · Syndal A vs Glen Waverley A',
    details: { scheduledDate: '2026-09-27', scheduledTime: '13:00', venue: 'Syndal Tennis Centre', timeZone: 'Australia/Melbourne' },
    targetType: 'FIXTURE', targetId: 'fixture-r13', readAt: null, createdAt: '2026-09-20T22:00:00.000Z',
  })
  assert.equal(byId[VENUE].match, 'Round 14 · Mount Waverley A vs Glen Waverley A')
  assert.equal(byId[FINAL].match, 'Grand Final · Glen Waverley A vs Pinewood A')
  assert.deepEqual([byId[ENTRIES].match, byId[ENTRIES].targetType, byId[ENTRIES].targetId], [null, 'COMPETITION', 'comp-seniors'])
  assert.deepEqual([byId[READ].readAt, byId[READ].details], [READ_AT.toISOString(), null])
})

test('I-CLUBNOTE-003: a fixture that no longer exists leaves the match empty instead of failing', async () => {
  notifications.find(n => n.id === VENUE).targetId = 'fixture-gone'
  const { status, body } = await call('GET', 'notifications')
  assert.equal(status, 200)
  assert.equal(body.data.find(n => n.id === VENUE).match, null)
})

test('I-CLUBNOTE-004: marking a notice read stores the time and answers with the notice', async () => {
  const before = Date.now()
  const { status, body } = await call('PATCH', `notifications/${VENUE}/read`)
  assert.equal(status, 200)
  assert.equal(body.data.id, VENUE)
  assert.equal(body.data.match, 'Round 14 · Mount Waverley A vs Glen Waverley A')
  assert.ok(Date.parse(body.data.readAt) >= before)
  assert.deepEqual(unread('user-admin'), [REMINDER, ENTRIES, FINAL])
})

test('I-CLUBNOTE-005: marking an already read notice keeps when it was first read', async () => {
  const { status, body } = await call('PATCH', `notifications/${READ}/read`)
  assert.equal(status, 200)
  assert.equal(body.data.readAt, READ_AT.toISOString())
})

test('I-CLUBNOTE-006: only the recipient can mark a notice, and only an in-app one', async () => {
  for (const noticeId of [OTHER_ADMIN, PLAYER_NOTICE, EMAIL_COPY, id(99)]) {
    const { status, body } = await call('PATCH', `notifications/${noticeId}/read`)
    assert.equal(status, 404, noticeId)
    assert.equal(body.code, 'NOTIFICATION_NOT_FOUND')
  }
  assert.equal(notifications.find(n => n.id === OTHER_ADMIN).readAt, null)
  assert.equal(notifications.find(n => n.id === EMAIL_COPY).readAt, null)
  assert.equal((await call('PATCH', 'notifications/NOT0001/read')).status, 400)
})

test('I-CLUBNOTE-007: mark all as read changes only the admin\'s unread in-app notices', async () => {
  const { status, body } = await call('PATCH', 'notifications/read-all')
  assert.equal(status, 200)
  assert.deepEqual(body.data, { updated: 4 })
  assert.deepEqual(unread('user-admin'), [])
  assert.equal(notifications.find(n => n.id === READ).readAt, READ_AT, 'already read keeps its time')
  assert.deepEqual(unread('user-mount-admin'), [OTHER_ADMIN])
  assert.equal(notifications.find(n => n.id === EMAIL_COPY).readAt, null)
  assert.deepEqual((await call('PATCH', 'notifications/read-all')).body.data, { updated: 0 })
})

test('I-CLUBNOTE-008: a player gets 403 and a database failure is a 503 that leaks nothing', async () => {
  for (const [method, path] of [['GET', 'notifications'], ['PATCH', `notifications/${PLAYER_NOTICE}/read`], ['PATCH', 'notifications/read-all']]) {
    const { status, body } = await call(method, path, 'chloe@club.example')
    assert.equal(status, 403, path)
    assert.equal(body.code, 'NOT_CLUB_ADMIN')
  }
  assert.deepEqual(unread('user-chloe'), [PLAYER_NOTICE])

  const original = prisma.notification.findMany
  prisma.notification.findMany = async () => { throw new Error('password=secret host=db.internal') }
  try {
    const { status, body } = await call('GET', 'notifications')
    assert.equal(status, 503)
    assert.equal(body.code, 'DATA_UNAVAILABLE')
    assert.ok(!JSON.stringify(body).includes('secret'))
  } finally {
    prisma.notification.findMany = original
  }
})
