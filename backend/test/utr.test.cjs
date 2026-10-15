const { test } = require('node:test')
const assert = require('node:assert/strict')
const { MockUtrProvider, EngageUtrProvider, mapRatings } = require('../dist/utr/utr.provider')
const { UtrService } = require('../dist/utr/utr.service')

test('UTR-001: mock uses the shared contract and returns independent fixtures', async () => {
  const provider = new MockUtrProvider()
  const first = await provider.getRatings()
  assert.equal(first.source, 'mock')
  assert.equal(first.singles, 6.25)
  first.singles = 0
  assert.equal((await provider.getRatings()).singles, 6.25)
})

test('UTR-002: mapping preserves missing ratings and estimated ranges, rejects invalid responses', () => {
  const body = { UTR: { Singles: null, Doubles: null, UnverifiedSingles: null, UnverifiedDoubles: null, Estimated: '4.00-6.00' } }
  assert.equal(mapRatings(body, 'utr').estimated, '4.00-6.00')
  assert.equal(mapRatings(body, 'utr').singles, null)
  assert.throws(() => mapRatings({}, 'utr'))
  assert.throws(() => mapRatings({ UTR: { ...body.UTR, Singles: '6.25' } }, 'utr'))
})

test('UTR-003: live adapter sends the player token and sanitizes failures without mock fallback', async (t) => {
  const provider = new EngageUtrProvider('https://example.com/api/v1')
  await assert.rejects(provider.getRatings(), /not connected/)
  const fetchMock = t.mock.method(global, 'fetch', async (url, options) => {
    assert.equal(url, 'https://example.com/api/v1/members/ratings')
    assert.equal(options.headers.Authorization, 'Bearer player-token')
    assert.equal(options.redirect, 'error')
    return { ok: true, json: async () => ({ UTR: { Singles: 7, Doubles: null, UnverifiedSingles: null, UnverifiedDoubles: null, Estimated: null } }) }
  })
  assert.equal((await provider.getRatings('player-token')).source, 'utr')
  fetchMock.mock.mockImplementation(async () => ({ ok: false, status: 401 }))
  await assert.rejects(provider.getRatings('player-token'), /expired or was revoked/)
  fetchMock.mock.mockImplementation(async () => { throw new Error('sensitive provider details') })
  await assert.rejects(provider.getRatings('player-token'), /Could not retrieve UTR ratings/)
})

test('UTR-004: configuration fails closed and refuses production mocks', async () => {
  const originalMode = process.env.UTR_PROVIDER
  const originalEnv = process.env.NODE_ENV
  try {
    delete process.env.UTR_PROVIDER
    const store = { getAccessToken: async () => null }
    await assert.rejects(new UtrService(store).syncUTRRating('player'), /not configured/)
    process.env.UTR_PROVIDER = 'engage'
    await assert.rejects(new UtrService(store).syncUTRRating('player'), /not connected/)
    process.env.UTR_PROVIDER = 'mock'
    process.env.NODE_ENV = 'production'
    assert.throws(() => new UtrService(store), /not allowed in production/)
  } finally {
    if (originalMode === undefined) delete process.env.UTR_PROVIDER
    else process.env.UTR_PROVIDER = originalMode
    if (originalEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = originalEnv
  }
})

test('UTR-005: the demo rating comes only from the mock provider, never in production', async () => {
  const originalMode = process.env.UTR_PROVIDER
  const originalEnv = process.env.NODE_ENV
  // The demo has no player, so it must never look up a real player's UTR connection.
  const store = { getAccessToken: async () => { throw new Error('demo looked up a player connection') } }
  try {
    delete process.env.NODE_ENV
    for (const mode of [undefined, 'disabled', 'engage']) {
      if (mode === undefined) delete process.env.UTR_PROVIDER
      else process.env.UTR_PROVIDER = mode
      await assert.rejects(new UtrService(store).getDemoRating(), /UTR demo is disabled/)
    }
    process.env.UTR_PROVIDER = 'mock'
    const service = new UtrService(store)
    const demo = await service.getDemoRating()
    assert.equal(demo.source, 'mock')
    assert.equal(demo.singles, 6.25)
    // A process switched to production after it started still refuses.
    process.env.NODE_ENV = 'production'
    await assert.rejects(service.getDemoRating(), /UTR demo is disabled/)
  } finally {
    if (originalMode === undefined) delete process.env.UTR_PROVIDER
    else process.env.UTR_PROVIDER = originalMode
    if (originalEnv === undefined) delete process.env.NODE_ENV
    else process.env.NODE_ENV = originalEnv
  }
})
