/** Checks the generated workbook: unique ids, resolvable FKs, consistent scores. */
const REPO = require('node:path').resolve(__dirname, '../..')
const XLSX = require(`${REPO}/node_modules/xlsx`)

const wb = XLSX.readFile(process.argv[2] || require('node:path').join(__dirname, 'competition_data.xlsx'))
const S = {}
for (const name of wb.SheetNames) S[name] = XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: '' })

const problems = []
const fail = m => problems.push(m)

// 1. Unique ids per sheet
for (const [name, rows] of Object.entries(S)) {
  if (name === 'README' || !rows.length || !('id' in rows[0])) continue
  const ids = rows.map(r => r.id)
  if (new Set(ids).size !== ids.length) fail(`${name}: duplicate id`)
}

// 2. Every foreign key resolves
const idsOf = n => new Set(S[n].map(r => r.id))
const FK = [
  ['Club', 'association_id', 'Association'], ['Venue', 'club_id', 'Club'],
  ['Competition', 'association_id', 'Association'], ['MatchFormat', 'competition_id', 'Competition'],
  ['EligibilityRule', 'competition_id', 'Competition'], ['Season', 'competition_id', 'Competition'],
  ['SectionGrade', 'season_id', 'Season'], ['Team', 'club_id', 'Club'],
  ['Team', 'section_id', 'SectionGrade'], ['Team', 'home_venue_id', 'Venue'],
  ['ClubMembership', 'player_id', 'Player'], ['ClubMembership', 'club_id', 'Club'],
  ['AssociationMembership', 'player_id', 'Player'], ['TeamPlayer', 'team_id', 'Team'],
  ['TeamPlayer', 'player_id', 'Player'], ['UtrLink', 'player_id', 'Player'],
  ['UtrRatingSnapshot', 'player_id', 'Player'], ['RankingEntry', 'cohort_id', 'RankingCohort'],
  ['RankingEntry', 'player_id', 'Player'], ['Fixture', 'section_id', 'SectionGrade'],
  ['Fixture', 'home_team_id', 'Team'], ['Fixture', 'away_team_id', 'Team'],
  ['Fixture', 'venue_id', 'Venue'], ['FixtureScheduleChange', 'fixture_id', 'Fixture'],
  ['FixtureScheduleChange', 'previous_venue_id', 'Venue'], ['FixtureScheduleChange', 'new_venue_id', 'Venue'],
  ['MatchResult', 'fixture_id', 'Fixture'], ['Rubber', 'match_result_id', 'MatchResult'],
  ['Rubber', 'match_format_id', 'MatchFormat'], ['RubberSet', 'rubber_id', 'Rubber'],
  ['RubberPlayer', 'rubber_id', 'Rubber'], ['RubberPlayer', 'player_id', 'Player'],
  ['LadderEntry', 'section_id', 'SectionGrade'], ['LadderEntry', 'team_id', 'Team'],
  ['PlayerStanding', 'section_id', 'SectionGrade'], ['PlayerStanding', 'player_id', 'Player'],
  ['PlayerAward', 'player_id', 'Player'], ['PlayerAward', 'competition_id', 'Competition'],
  ['PlayerAward', 'season_id', 'Season'], ['PlayerAward', 'team_id', 'Team'],
  ['UserRole', 'club_id', 'Club'], ['UserRole', 'team_id', 'Team'],
]
for (const [sheet, col, target] of FK) {
  const valid = idsOf(target)
  for (const row of S[sheet]) {
    const v = row[col]
    if (v !== '' && !valid.has(v)) fail(`${sheet}.${col} = "${v}" not found in ${target}`)
  }
}

// 3. Emails on Player/Notification/UserRole must be real accounts
const accounts = new Set(S.Player.map(p => p._lookup_user_email))
for (const sheet of ['Notification', 'UserRole']) {
  for (const r of S[sheet]) if (!accounts.has(r._lookup_user_email)) fail(`${sheet}: unknown _lookup_user_email ${r._lookup_user_email}`)
}

// 4. Home team plays at its own venue, except at the neutral finals venue
for (const f of S.Fixture) {
  const home = S.Team.find(t => t.id === f.home_team_id)
  if (f.venue_id !== home.home_venue_id && f.venue_id !== 'VEN99') {
    const moved = S.FixtureScheduleChange.some(c => c.fixture_id === f.id && c.change_type === 'VENUE_CHANGED')
    if (!moved) fail(`${f.id}: venue ${f.venue_id} is neither the home venue nor an explained move`)
  }
  if (f.home_team_id === f.away_team_id) fail(`${f.id}: team plays itself`)
}

// 5. Completed fixtures have exactly one result; scheduled have none
for (const f of S.Fixture) {
  const n = S.MatchResult.filter(m => m.fixture_id === f.id).length
  if (f.status === 'COMPLETED' && n !== 1) fail(`${f.id}: COMPLETED but ${n} results`)
  if (f.status !== 'COMPLETED' && n !== 0) fail(`${f.id}: ${f.status} but has a result`)
}

// 6. Rubber totals match the result, and the declared winner matches the sets
for (const res of S.MatchResult) {
  const rs = S.Rubber.filter(r => r.match_result_id === res.id)
  const home = rs.filter(r => r.winner_side === 'HOME').length
  const away = rs.filter(r => r.winner_side === 'AWAY').length
  if (home !== res.home_rubbers || away !== res.away_rubbers) fail(`${res.id}: rubber tally ${home}-${away} != ${res.home_rubbers}-${res.away_rubbers}`)
  const expected = home > away ? 'HOME_WIN' : home < away ? 'AWAY_WIN' : 'DRAW'
  if (res.outcome !== expected) fail(`${res.id}: outcome ${res.outcome} != ${expected}`)
}

for (const r of S.Rubber) {
  const sets = S.RubberSet.filter(s => s.rubber_id === r.id)
  // A walkover or forfeit is won without sets; everything else must have sets.
  if (['WALKOVER', 'FORFEIT'].includes(r.outcome_type)) {
    if (sets.length) fail(`${r.id}: ${r.outcome_type} should have no sets`)
    continue
  }
  if (!sets.length) { fail(`${r.id}: ${r.outcome_type} with no sets`); continue }
  if (r.outcome_type === 'COMPLETED') {
    const hs = sets.filter(s => s.home_games > s.away_games).length
    const as = sets.length - hs
    const bySets = hs > as ? 'HOME' : 'AWAY'
    if (bySets !== r.winner_side) fail(`${r.id}: sets say ${bySets}, winner_side says ${r.winner_side}`)
  }
  for (const s of sets) {
    if (s.home_games === s.away_games) fail(`${s.id}: tied set ${s.home_games}-${s.away_games}`)
    if (s.is_tiebreak === true && (s.home_tiebreak_points === '' || s.away_tiebreak_points === '')) fail(`${s.id}: tiebreak set without points`)
  }
}

// 7. Each rubber has the right number of participants per side
for (const r of S.Rubber) {
  const want = r.rubber_type === 'SINGLES' ? 1 : 2
  for (const side of ['HOME', 'AWAY']) {
    const n = S.RubberPlayer.filter(p => p.rubber_id === r.id && p.side === side).length
    if (n !== want) fail(`${r.id}: ${side} has ${n} players, expected ${want}`)
  }
}

// 8. Players only appear for a team they are registered to
const registered = new Set(S.TeamPlayer.map(tp => `${tp.team_id}|${tp.player_id}`))
for (const rp of S.RubberPlayer) {
  const rubber = S.Rubber.find(r => r.id === rp.rubber_id)
  const res = S.MatchResult.find(m => m.id === rubber.match_result_id)
  const fx = S.Fixture.find(f => f.id === res.fixture_id)
  const teamId = rp.side === 'HOME' ? fx.home_team_id : fx.away_team_id
  if (!registered.has(`${teamId}|${rp.player_id}`)) fail(`${rp.id}: ${rp.player_id} not registered to ${teamId}`)
}

// 9. Ladder recount
for (const sec of ['SEC01', 'SEC02']) {
  const secFixtures = S.Fixture.filter(f => f.section_id === sec)
  for (const entry of S.LadderEntry.filter(l => l.section_id === sec)) {
    let played = 0, won = 0, rf = 0, points = 0
    for (const f of secFixtures) {
      const res = S.MatchResult.find(m => m.fixture_id === f.id)
      if (!res) continue
      const isHome = f.home_team_id === entry.team_id
      const isAway = f.away_team_id === entry.team_id
      if (!isHome && !isAway) continue
      played++
      const mine = isHome ? res.home_rubbers : res.away_rubbers
      rf += mine; points += mine
      const winner = res.outcome === 'HOME_WIN' ? f.home_team_id : f.away_team_id
      if (winner === entry.team_id) { won++; points += 4 }
    }
    if (played !== entry.played) fail(`${entry.id}: played ${entry.played} != ${played}`)
    if (won !== entry.won) fail(`${entry.id}: won ${entry.won} != ${won}`)
    if (rf !== entry.rubbers_for) fail(`${entry.id}: rubbers_for ${entry.rubbers_for} != ${rf}`)
    if (points !== entry.points) fail(`${entry.id}: points ${entry.points} != ${points}`)
    if (entry.won + entry.lost + entry.drawn !== entry.played) fail(`${entry.id}: W/L/D does not sum to played`)
  }
  const positions = S.LadderEntry.filter(l => l.section_id === sec).map(l => l.position).sort((a, b) => a - b)
  if (positions.join() !== [1, 2, 3, 4, 5, 6, 7, 8].join()) fail(`${sec}: ladder positions are not 1..8`)
}

// 10. Everyone with a roster spot actually played
const rostered = S.TeamPlayer.filter(tp => tp.status === 'ACTIVE').map(tp => tp.player_id)
const appeared = new Set(S.RubberPlayer.map(rp => rp.player_id))
const idle = rostered.filter(p => !appeared.has(p))
if (idle.length) fail(`${idle.length} rostered players never appear in a rubber (e.g. ${idle.slice(0, 3)})`)

// 11. Notifications point at real fixtures and only IN_APP rows are readable
for (const n of S.Notification) {
  if (n.target_type === 'FIXTURE' && !idsOf('Fixture').has(n.target_id)) fail(`${n.id}: unknown fixture ${n.target_id}`)
  if (n.channel === 'EMAIL' && n.read_at !== '') fail(`${n.id}: EMAIL row must not carry read_at`)
  try { JSON.parse(n.details) } catch { fail(`${n.id}: details is not valid JSON`) }
}

// 12. One current ranking row per player per cohort
for (const c of S.RankingCohort) {
  const rows = S.RankingEntry.filter(r => r.cohort_id === c.id)
  if (rows.length !== S.Player.length) fail(`${c.id}: ${rows.length} entries for ${S.Player.length} players`)
  const ranks = rows.map(r => r.rank).sort((a, b) => a - b)
  if (ranks[0] !== 1 || ranks[ranks.length - 1] !== rows.length) fail(`${c.id}: ranks are not 1..${rows.length}`)
}

console.log(problems.length ? `FAILED (${problems.length})` : 'All checks passed')
for (const p of problems.slice(0, 25)) console.log('  - ' + p)
process.exitCode = problems.length ? 1 : 0
