const { test } = require('node:test')
const assert = require('node:assert/strict')
const { rubberWinner } = require('../dist/common/rubber-winner')

const set = (homeGames, awayGames) => ({ homeGames, awayGames })

test('a recorded winner wins even with fewer games (retirement, walkover)', () => {
  assert.equal(rubberWinner('AWAY', [set(6, 2), set(3, 1)]), 'AWAY')
})

test('a completed rubber is decided by sets, then by games', () => {
  assert.equal(rubberWinner(null, [set(6, 7), set(6, 3), set(6, 1)]), 'HOME')
  assert.equal(rubberWinner(null, [set(6, 4), set(3, 6), set(2, 6)]), 'AWAY')
  // One set each: 10 games to 8 decides it.
  assert.equal(rubberWinner(null, [set(6, 2), set(4, 6)]), 'HOME')
  assert.equal(rubberWinner(null, [set(8, 5)]), 'HOME')
})

test('a full tie, a missing score or no sets is unknown, never a guess', () => {
  assert.equal(rubberWinner(null, [set(6, 4), set(4, 6)]), null)
  assert.equal(rubberWinner(null, [set(6, 4), set(null, null)]), null)
  assert.equal(rubberWinner(null, []), null)
})
