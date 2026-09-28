const { test, before, after } = require('node:test')
const assert = require('node:assert/strict')
const bcrypt = require('bcryptjs')
const { Logger } = require('@nestjs/common')
const { Test } = require('@nestjs/testing')
const { AuthService } = require('../dist/auth/auth.service')
const { AuthModule } = require('../dist/auth/auth.module')
const { PrismaService } = require('../dist/prisma/prisma.service')
const { PrismaModule } = require('../dist/prisma/prisma.module')

// In-memory accounts only: never touch the developer's database.
const PASSWORD = 'CorrectHorse#1'
let accounts = {}
let databaseDown = false
const prisma = {
  user: {
    findUnique: async ({ where }) => {
      if (databaseDown) throw new Error('connect ECONNREFUSED 127.0.0.1:5432')
      return accounts[where.email] ?? null
    },
  },
}
const auth = new AuthService(prisma)

before(async () => {
  Logger.overrideLogger(false) // the outage test logs an expected error
  accounts = { 'player@club.example': { email: 'player@club.example', passwordHash: await bcrypt.hash(PASSWORD, 4) } }
})

test('AUTH-001: log in to an existing account with the correct password', async () => {
  assert.deepEqual(await auth.login('player@club.example', PASSWORD), { result: 'login_success' })
})

test('AUTH-002: a wrong password is refused', async () => {
  assert.deepEqual(await auth.login('player@club.example', 'wrong-password'), { result: 'login_failed' })
})

test('AUTH-003: an email with no account is refused, not an error', async () => {
  assert.deepEqual(await auth.login('nobody@club.example', PASSWORD), { result: 'login_failed' })
})

test('AUTH-004: email is matched ignoring capitals and surrounding spaces', async () => {
  assert.deepEqual(await auth.login('  Player@Club.EXAMPLE ', PASSWORD), { result: 'login_success' })
})

test('AUTH-005: a database outage is a server error, never "wrong password"', async () => {
  databaseDown = true
  try {
    await assert.rejects(auth.login('player@club.example', PASSWORD), error => {
      assert.equal(error.getStatus(), 500)
      assert.doesNotMatch(JSON.stringify(error.getResponse()), /ECONNREFUSED|5432/)
      return true
    })
  } finally {
    databaseDown = false
  }
})

// ── Integration: the real route, controller and service, with the fake database.
let app, url
before(async () => {
  const module = await Test.createTestingModule({ imports: [PrismaModule, AuthModule] })
    .overrideProvider(PrismaService).useValue(prisma).compile()
  app = module.createNestApplication({ logger: false })
  await app.listen(0, '127.0.0.1')
  url = await app.getUrl()
})
after(async () => { await app?.close() })

const post = async body => {
  const response = await fetch(`${url}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  return { status: response.status, body: await response.json() }
}

test('I-AUTH-001: POST /auth/login answers 200 for both success and failure', async () => {
  assert.deepEqual(await post({ email: 'player@club.example', password: PASSWORD }), { status: 200, body: { result: 'login_success' } })
  assert.deepEqual(await post({ email: 'player@club.example', password: 'nope' }), { status: 200, body: { result: 'login_failed' } })
})

test('I-AUTH-002: POST /auth/login with an empty body is a failed login, not a crash', async () => {
  assert.deepEqual(await post({}), { status: 200, body: { result: 'login_failed' } })
})
