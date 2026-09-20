const { test } = require('node:test')
const assert = require('node:assert/strict')
const { MockUtrProvider, EngageUtrProvider, mapRatings } = require('../dist/utr/utr.provider')
const { UtrService } = require('../dist/utr/utr.service')

test('mock uses the shared contract and returns independent fixtures', async () => {
  const provider = new MockUtrProvider()
  const first = await provider.getRatings()
  assert.equal(first.source, 'mock')
  assert.equal(first.singles, 6.25)
  first.singles = 0
  assert.equal((await provider.getRatings()).singles, 6.25)
})

test('mapping preserves missing ratings and estimated ranges, rejects invalid responses', () => {
  const body = { UTR: { Singles: null, Doubles: null, UnverifiedSingles: null, UnverifiedDoubles: null, Estimated: '4.00-6.00' } }
  assert.equal(mapRatings(body, 'utr').estimated, '4.00-6.00')
  assert.equal(mapRatings(body, 'utr').singles, null)
  assert.throws(() => mapRatings({}, 'utr'))
  assert.throws(() => mapRatings({ UTR: { ...body.UTR, Singles: '6.25' } }, 'utr'))
})

test('live adapter sends the player token and sanitizes failures without mock fallback', async (t) => {
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

test('configuration fails closed and refuses production mocks', async () => {
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
